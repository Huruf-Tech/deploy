/**
 * Copyright © Huruf Tech 2026
 *
 * This is a generated file. Do not edit the contents of this file!
 */

import { BaseSDK } from "./base.js";

import { domainsModule } from "./modules/domains.js";
import { projectGroupsModule } from "./modules/projectGroups.js";
import { projectsModule } from "./modules/projects.js";
import { billingModule } from "./modules/billing.js";
import { billingAdminModule } from "./modules/billingAdmin.js";
import { plansModule } from "./modules/plans.js";
import { gitIntegrationsModule } from "./modules/gitIntegrations.js";
import { githubHooksModule } from "./modules/githubHooks.js";
import { templatesModule } from "./modules/templates.js";
import { variablesModule } from "./modules/variables.js";
import { homeModule } from "./modules/home.js";
import { indexModule } from "./modules/index.js";
import { agentsModule } from "./modules/agents.js";
import { networksModule } from "./modules/networks.js";
import { registriesModule } from "./modules/registries.js";
import { serversModule } from "./modules/servers.js";
import { storagesModule } from "./modules/storages.js";
import { streamsModule } from "./modules/streams.js";
import { ingressModule } from "./modules/ingress.js";
import { alertEventsModule } from "./modules/alertEvents.js";
import { alertRulesModule } from "./modules/alertRules.js";
import { controlPlaneModule } from "./modules/controlPlane.js";
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
        "domains",
        "projectGroups",
        "projects",
        "billing",
        "billingAdmin",
        "plans",
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
