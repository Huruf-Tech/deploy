import { Router } from "@/core/http/router.ts";
import { Response } from "@/core/http/response.ts";
import { bodyAsJson, queryAsJson } from "@/core/http/utils.ts";
import { $objectId, createCRUD } from "@/core/utils/createCRUD.ts";
import { createHashSync, SupportedHashAlg } from "@/core/utils/hash.ts";
import { Env } from "@/core/utils/env.ts";
import z from "zod";
import { ObjectId } from "mongodb";
import type { JWTPayload } from "jose";
import { mongodb } from "@/database.ts";
import { Wallet } from "@/lib/wallet.ts";
import { OAuth2 } from "@/lib/oauth2.ts";
import { walletModel, walletSchema } from "@/schemas/wallet.ts";
import { userModel } from "@/schemas/user.ts";
import { tenantModel } from "@/schemas/tenant.ts";
import { tenantMemberModel } from "@/schemas/tenantMember.ts";
import { withTenant } from "@/utils/withTenant.ts";
import { withAuthSession } from "@/utils/withAuthSession.ts";

type TChallengePayload = JWTPayload & {
  challengeId: string;
  codeHash: string;
  details: {
    sender: {
      tenant: string;
      user: string;
      name: string;
      image?: string;
    };
    receiver: {
      tenant: string;
      tenantName: string;
      tenantLogo?: string;
      user: string;
      name: string;
      image?: string;
    };
    transactionDetails: {
      currency: string;
      amount: number;
      fee: number;
      // ObjectId `tenant` becomes a string once serialized into the JWT.
      feeStructure: {
        total: number;
        breakdown: Array<{ tenant: string; name: string; amount: number }>;
      };
      description?: string;
      metadata?: Record<string, string | number | boolean>;
    };
  };
};

const resolveCurrency = async (input?: string) => {
  const currency = input ?? await Env.get("DEFAULT_CURRENCY", true) ?? "pkr";
  return currency.toLowerCase();
};

export default new Router("/api", function wallets(router) {
  router.get("/metadata", function metadata() {
    const $return = z.object({
      defaultCurrency: z.string(),
      availableCurrencies: z.array(z.string()),
    });

    return {
      shape: () => ({
        return: $return,
      }),
      handler: async () => {
        const defaultCurrency = await resolveCurrency();

        const availableCurrencies = new Set(
          (await Env.list("AVAILABLE_CURRENCIES")).map((currency) =>
            currency.toLowerCase()
          ),
        );

        availableCurrencies.add(defaultCurrency);

        return Response.json({
          defaultCurrency,
          availableCurrencies: [...availableCurrencies],
        });
      },
    };
  });

  router.get("/transfer/sign", function signTransfer() {
    const $query = z.object({
      receiver: z.string().min(1),
      amount: z.coerce.number().int().positive(),
      description: z.string().max(300).optional(),
      metadata: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean()]),
      ).optional(),
      currency: z.string().optional(),
    });

    const $entity = z.object({
      tenant: z.string(),
      user: z.string(),
      name: z.string(),
      image: z.string().optional(),
    });

    const $feeStructure = z.object({
      total: z.number(),
      breakdown: z.array(z.object({
        tenant: z.instanceof(ObjectId),
        name: z.string(),
        amount: z.number(),
      })),
    });

    const $return = z.object({
      sender: $entity,
      receiver: $entity.extend({
        tenantName: z.string(),
        tenantLogo: z.string().optional(),
      }),
      transactionDetails: z.object({
        type: z.string().optional(),
        currency: z.string(),
        amount: z.number(),
        fee: z.number(),
        feeStructure: $feeStructure,
        description: z.string().optional(),
        metadata: z.record(
          z.string(),
          z.union([z.string(), z.number(), z.boolean()]),
        ).optional(),
      }),
      challenge: z.object({
        token: z.string(),
      }),
    });

    return {
      shape: () => ({
        query: $query,
        return: $return,
      }),
      handler: async (req: Request) => {
        const { tenant: senderTenant, user: senderUser } = await withTenant(
          req,
        );

        const query = $query.parse(queryAsJson(req));
        const currency = await resolveCurrency(query.currency);

        // ObjectId, email or phone number.
        const [receiverRef, tenantRef] = query.receiver.split(":");

        const receivingUser = await userModel.findOne({
          $or: [
            ...(ObjectId.isValid(receiverRef)
              ? [{ _id: new ObjectId(receiverRef) }]
              : []),
            { email: receiverRef },
            { phoneNumber: receiverRef },
          ],
        }, { projection: { _id: 1, name: 1, image: 1 } });

        if (!receivingUser) {
          throw Response.badRequest("Receiving user not found!");
        }

        const memberships = await tenantMemberModel.find({
          user: receivingUser._id,
          ...(tenantRef && ObjectId.isValid(tenantRef)
            ? { tenant: new ObjectId(tenantRef) }
            : { isOwner: true }),
        }, { projection: { tenant: 1 } }).toArray();

        if (!memberships.length) {
          throw Response.badRequest(
            "No relevant account found for the receiver!",
          );
        }

        const receiverTenant = await tenantModel.findOne({
          _id: { $in: memberships.map((member) => member.tenant) },
        }, { projection: { name: 1, logo: 1 } });

        if (!receiverTenant) {
          throw Response.badRequest("Receiver account not found!");
        }

        if (senderTenant._id.equals(receiverTenant._id)) {
          throw Response.badRequest(
            "You cannot transfer funds to your own account!",
          );
        }

        const feeStructure = await Wallet.calculateFee({
          fromTenant: senderTenant._id,
          toTenant: receiverTenant._id,
          currency,
          amount: query.amount,
        });

        const transferDetails = {
          sender: {
            tenant: senderTenant._id.toString(),
            user: senderUser._id.toString(),
            name: senderUser.name,
            image: senderUser.image,
          },
          receiver: {
            tenant: receiverTenant._id.toString(),
            tenantName: receiverTenant.name,
            tenantLogo: receiverTenant.logo,
            user: receivingUser._id.toString(),
            name: receivingUser.name,
            image: receivingUser.image,
          },
          transactionDetails: {
            currency,
            amount: query.amount,
            fee: feeStructure.total,
            feeStructure,
            description: query.description,
            metadata: query.metadata,
          },
        };

        const challengeId = crypto.randomUUID();
        const codeHash = createHashSync(
          SupportedHashAlg.SHA_256,
          `${challengeId}`,
        );

        const token = await OAuth2.signJWT({
          purpose: "wallet_transfer",
          challengeId,
          codeHash,
          details: transferDetails,
        }, {
          subject: senderUser._id.toString(),
          ttl: 60 * 5,
        });

        return Response.created(
          {
            ...transferDetails,
            challenge: {
              token,
            },
          },
        );
      },
    };
  });

  router.post("/transfer", function transfer() {
    const $body = z.object({
      method: z.string().optional(),
      token: z.string(),
      tags: z.array(z.string()).optional(),
    });

    const $return = z.object({
      transaction: z.object({
        reference: z.string(),
        idempotencyKey: z.string(),
        debit: $objectId,
        credit: $objectId,
      }),
    });

    return {
      shape: () => ({
        body: $body,
        return: $return,
      }),
      handler: async (req: Request) => {
        const { user } = await withAuthSession(req);

        const body = $body.parse(await bodyAsJson(req));

        const { payload } = await OAuth2.verifyJWT<TChallengePayload>(
          body.token,
          {},
        ).catch(() => {
          throw Response.badRequest("Invalid or expired challenge token!");
        });

        const { details } = payload;
        const { transactionDetails } = details;

        const fromTenant = new ObjectId(details.sender.tenant);

        const transaction = await mongodb.withSession((session) =>
          session.withTransaction(async () => {
            const mainTransfer = await Wallet.transfer({
              idempotencyKey: payload.challengeId,
              fromTenant,
              toTenant: new ObjectId(details.receiver.tenant),
              currency: transactionDetails.currency,
              amount: transactionDetails.amount,
              user: user._id,
              purpose: "wallet_transfer",
              description: transactionDetails.description,
              metadata: transactionDetails.metadata,
              tags: body.tags ?? [],
              allowOverdraft: true,
              databaseSession: session,
            });

            for (const fee of transactionDetails.feeStructure.breakdown) {
              const toTenant = new ObjectId(fee.tenant);

              // Skip zero/negative or self-directed fee legs — Wallet.transfer
              // rejects both.
              if (fee.amount <= 0 || fromTenant.equals(toTenant)) continue;

              await Wallet.transfer({
                fromTenant,
                toTenant,
                currency: transactionDetails.currency,
                amount: fee.amount,
                user: user._id,
                purpose: "fund_transfer_fee",
                description: "Fund transfer fee charges",
                databaseSession: session,
              });
            }

            return mainTransfer;
          })
        );

        return Response.created(
          {
            transaction,
          },
        );
      },
    };
  });

  router.post("/update/overdraft-limit", function updateOverdraftLimit() {
    const $body = z.object({
      userId: $objectId,
      tenantId: $objectId,
      limit: z.number().min(0),
    });

    return {
      shape: () => ({
        body: $body,
      }),
      handler: async (req: Request) => {
        const body = $body.parse(await bodyAsJson(req));
        await walletModel.updateOne(
          { user: body.userId, tenant: body.tenantId },
          { 
            $set: { overdraftLimit: body.limit },
            $setOnInsert: {
              currency: await resolveCurrency(),
              balance: 0,
              previousBalance: 0,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );

        return Response.ok();
      },
    };
  });

  router.get("/overdraft-limit", function getOverdraftLimit() {
    const $query = z.object({
      userId: $objectId,
      tenantId: $objectId,
    });

    const $return = z.object({
      overdraftLimit: z.number(),
    });

    return {
      shape: () => ({
        query: $query,
        return: $return,
      }),
      handler: async (req: Request) => {
        const query = $query.parse(queryAsJson(req));
        const wallet = await walletModel.findOne(
          { user: query.userId, tenant: query.tenantId },
          { projection: { overdraftLimit: 1 } }
        );

        return Response.json({
          overdraftLimit: wallet?.overdraftLimit ?? 0,
        });
      },
    };
  });

  createCRUD({
    router,
    schema: walletSchema,
    model: walletModel,
  }, {
    disable: {
      create: true,
      update: true,
      del: true,
    },
    isolationFields: async (req) => {
      const { tenant } = await withTenant(req);
      return {
        tenant: tenant._id,
      };
    },
  });
});
