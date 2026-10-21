/**
 * Copyright © Huruf Tech 2026
 *
 * This is a generated file. Do not edit the contents of this file!
 */

import { BaseSDK } from "./base.js";

import { homeModule } from "./modules/home.js";
import { indexModule } from "./modules/index.js";
import { agentsModule } from "./modules/agents.js";
import { serversModule } from "./modules/servers.js";
import { streamsModule } from "./modules/streams.js";
import { wellKnownModule } from "./modules/.well-known.js";
import { accessControlModule } from "./modules/accessControl.js";
import { accessControlPoliciesModule } from "./modules/accessControlPolicies.js";
import { apiKeysModule } from "./modules/apiKeys.js";
import { authModule } from "./modules/auth.js";
import { envsModule } from "./modules/envs.js";
import { imageKitModule } from "./modules/imagekit.js";
import { meModule } from "./modules/me.js";
import { oauthModule } from "./modules/oauth.js";
import { oauthClientsModule } from "./modules/oauthClients.js";
import { tenantInvitesModule } from "./modules/tenantInvites.js";
import { tenantMembersModule } from "./modules/tenantMembers.js";
import { tenantMembershipsModule } from "./modules/tenantMemberships.js";
import { tenantsModule } from "./modules/tenants.js";
import { usersModule } from "./modules/users.js";
import { walletLedgersModule } from "./modules/walletLedgers.js";
import { walletsModule } from "./modules/wallets.js";

import { essentialsEntry } from "./plugins/essentials/entry.js";

export class ThunderSDK extends BaseSDK {
    protected static _actionsList?: string[];
    protected static _moduleNames = [
        "home",
        "index",
        "agents",
        "servers",
        "streams",
        "wellKnown",
        "accessControl",
        "accessControlPolicies",
        "apiKeys",
        "auth",
        "envs",
        "imageKit",
        "me",
        "oauth",
        "oauthClients",
        "tenantInvites",
        "tenantMembers",
        "tenantMemberships",
        "tenants",
        "users",
        "walletLedgers",
        "wallets",
    ];
    
    static home = homeModule(this);
    static index = indexModule(this);
    static agents = agentsModule(this);
    static servers = serversModule(this);
    static streams = streamsModule(this);
    static wellKnown = wellKnownModule(this);
    static accessControl = accessControlModule(this);
    static accessControlPolicies = accessControlPoliciesModule(this);
    static apiKeys = apiKeysModule(this);
    static auth = authModule(this);
    static envs = envsModule(this);
    static imageKit = imageKitModule(this);
    static me = meModule(this);
    static oauth = oauthModule(this);
    static oauthClients = oauthClientsModule(this);
    static tenantInvites = tenantInvitesModule(this);
    static tenantMembers = tenantMembersModule(this);
    static tenantMemberships = tenantMembershipsModule(this);
    static tenants = tenantsModule(this);
    static users = usersModule(this);
    static walletLedgers = walletLedgersModule(this);
    static wallets = walletsModule(this);

    static override plugins = {
        essentials: essentialsEntry,
    }

    static getModuleNames() {
        return this._moduleNames;
    }

    static getModule(name: string) {
        if (!this.getModuleNames().includes(name)) {
            throw new Error(`Module not found: ${name}`);
        }

        return this[name as keyof ThunderSDK] as Record<
            string,
            (data: unknown) => Promise<unknown>
        >;
    }

    static hasModule(name: string) {
        return this.getModuleNames().includes(name);
    }

    static getMetadata(module: object | string) {
        if (typeof module === "object") {
            return this._moduleMetadata.get(module);
        }

        return this._moduleMetadata.get(
            this.getModule(module),
        );
    }

    static hasMetadata(module: object | string) {
        try {
            if (typeof module === "object") {
                return this._moduleMetadata.has(module);
            }

            return this._moduleMetadata.has(
                this.getModule(module),
            );
        } catch {
            return false;
        }
    }

    static getGroup(module: object | string) {
        if (typeof module === "object") {
            return this._moduleGroup.get(module);
        }

        return this._moduleGroup.get(
            this.getModule(module),
        );
    }

    static hasGroup(module: object | string) {
        try {
            if (typeof module === "object") {
                return this._moduleGroup.has(module);
            }

            if(!this.hasModule(module)) {
                return [...this._moduleGroup.values()].includes(module);
            }

            return this._moduleGroup.has(
                this.getModule(module),
            );
        } catch {
            return false;
        }
    }

    static listActions(moduleName?: string) {
        const actions = (() => {
            if (this._actionsList) return this._actionsList;

            const unpackModules: string[] = [];

            this.getModuleNames().forEach((name) => {
                Object.keys(this.getModule(name)).forEach((action) => {
                    unpackModules.push(`${name}.${action}`);
                });
            });

            return this._actionsList = unpackModules;
        })();

        if (moduleName) {
            return actions.filter((action) => action.startsWith(`${moduleName}.`));
        }

        return actions;
    }
}
