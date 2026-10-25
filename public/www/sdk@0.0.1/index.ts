/**
 * Copyright © Huruf Tech 2026
 *
 * This is a generated file. Do not edit the contents of this file!
 */

import { BaseSDK } from "./base.ts";

import { domainsModule } from "./modules/domains.ts";
import { projectGroupsModule } from "./modules/projectGroups.ts";
import { projectsModule } from "./modules/projects.ts";
import { billingModule } from "./modules/billing.ts";
import { billingAdminModule } from "./modules/billingAdmin.ts";
import { plansModule } from "./modules/plans.ts";
import { aiModule } from "./modules/ai.ts";
import { gitIntegrationsModule } from "./modules/gitIntegrations.ts";
import { githubHooksModule } from "./modules/githubHooks.ts";
import { templatesModule } from "./modules/templates.ts";
import { variablesModule } from "./modules/variables.ts";
import { homeModule } from "./modules/home.ts";
import { indexModule } from "./modules/index.ts";
import { agentsModule } from "./modules/agents.ts";
import { networksModule } from "./modules/networks.ts";
import { registriesModule } from "./modules/registries.ts";
import { serversModule } from "./modules/servers.ts";
import { storagesModule } from "./modules/storages.ts";
import { streamsModule } from "./modules/streams.ts";
import { ingressModule } from "./modules/ingress.ts";
import { alertEventsModule } from "./modules/alertEvents.ts";
import { alertRulesModule } from "./modules/alertRules.ts";
import { controlPlaneModule } from "./modules/controlPlane.ts";
import { wellKnownModule } from "./modules/.well-known.ts";
import { accessControlModule } from "./modules/accessControl.ts";
import { accessControlPoliciesModule } from "./modules/accessControlPolicies.ts";
import { apiKeysModule } from "./modules/apiKeys.ts";
import { authModule } from "./modules/auth.ts";
import { envsModule } from "./modules/envs.ts";
import { imageKitModule } from "./modules/imagekit.ts";
import { meModule } from "./modules/me.ts";
import { oauthModule } from "./modules/oauth.ts";
import { oauthClientsModule } from "./modules/oauthClients.ts";
import { tenantInvitesModule } from "./modules/tenantInvites.ts";
import { tenantMembersModule } from "./modules/tenantMembers.ts";
import { tenantMembershipsModule } from "./modules/tenantMemberships.ts";
import { tenantsModule } from "./modules/tenants.ts";
import { usersModule } from "./modules/users.ts";
import { walletLedgersModule } from "./modules/walletLedgers.ts";
import { walletsModule } from "./modules/wallets.ts";

import { essentialsEntry } from "./plugins/essentials/entry.ts";

export class ThunderSDK extends BaseSDK {
    protected static _actionsList?: string[];
    protected static _moduleNames = [
        "domains",
        "projectGroups",
        "projects",
        "billing",
        "billingAdmin",
        "plans",
        "ai",
        "gitIntegrations",
        "githubHooks",
        "templates",
        "variables",
        "home",
        "index",
        "agents",
        "networks",
        "registries",
        "servers",
        "storages",
        "streams",
        "ingress",
        "alertEvents",
        "alertRules",
        "controlPlane",
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
    
    static domains: ReturnType<typeof domainsModule> = domainsModule(this);
    static projectGroups: ReturnType<typeof projectGroupsModule> = projectGroupsModule(this);
    static projects: ReturnType<typeof projectsModule> = projectsModule(this);
    static billing: ReturnType<typeof billingModule> = billingModule(this);
    static billingAdmin: ReturnType<typeof billingAdminModule> = billingAdminModule(this);
    static plans: ReturnType<typeof plansModule> = plansModule(this);
    static ai: ReturnType<typeof aiModule> = aiModule(this);
    static gitIntegrations: ReturnType<typeof gitIntegrationsModule> = gitIntegrationsModule(this);
    static githubHooks: ReturnType<typeof githubHooksModule> = githubHooksModule(this);
    static templates: ReturnType<typeof templatesModule> = templatesModule(this);
    static variables: ReturnType<typeof variablesModule> = variablesModule(this);
    static home: ReturnType<typeof homeModule> = homeModule(this);
    static index: ReturnType<typeof indexModule> = indexModule(this);
    static agents: ReturnType<typeof agentsModule> = agentsModule(this);
    static networks: ReturnType<typeof networksModule> = networksModule(this);
    static registries: ReturnType<typeof registriesModule> = registriesModule(this);
    static servers: ReturnType<typeof serversModule> = serversModule(this);
    static storages: ReturnType<typeof storagesModule> = storagesModule(this);
    static streams: ReturnType<typeof streamsModule> = streamsModule(this);
    static ingress: ReturnType<typeof ingressModule> = ingressModule(this);
    static alertEvents: ReturnType<typeof alertEventsModule> = alertEventsModule(this);
    static alertRules: ReturnType<typeof alertRulesModule> = alertRulesModule(this);
    static controlPlane: ReturnType<typeof controlPlaneModule> = controlPlaneModule(this);
    static wellKnown: ReturnType<typeof wellKnownModule> = wellKnownModule(this);
    static accessControl: ReturnType<typeof accessControlModule> = accessControlModule(this);
    static accessControlPolicies: ReturnType<typeof accessControlPoliciesModule> = accessControlPoliciesModule(this);
    static apiKeys: ReturnType<typeof apiKeysModule> = apiKeysModule(this);
    static auth: ReturnType<typeof authModule> = authModule(this);
    static envs: ReturnType<typeof envsModule> = envsModule(this);
    static imageKit: ReturnType<typeof imageKitModule> = imageKitModule(this);
    static me: ReturnType<typeof meModule> = meModule(this);
    static oauth: ReturnType<typeof oauthModule> = oauthModule(this);
    static oauthClients: ReturnType<typeof oauthClientsModule> = oauthClientsModule(this);
    static tenantInvites: ReturnType<typeof tenantInvitesModule> = tenantInvitesModule(this);
    static tenantMembers: ReturnType<typeof tenantMembersModule> = tenantMembersModule(this);
    static tenantMemberships: ReturnType<typeof tenantMembershipsModule> = tenantMembershipsModule(this);
    static tenants: ReturnType<typeof tenantsModule> = tenantsModule(this);
    static users: ReturnType<typeof usersModule> = usersModule(this);
    static walletLedgers: ReturnType<typeof walletLedgersModule> = walletLedgersModule(this);
    static wallets: ReturnType<typeof walletsModule> = walletsModule(this);

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
                Object.entries(this.getModule(name)).forEach(([action, fn]) => {
                    if (typeof fn === "function") unpackModules.push(`${name}.${action}`);
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
