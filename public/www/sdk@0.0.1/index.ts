/**
 * Copyright © Huruf Tech 2026
 *
 * This is a generated file. Do not edit the contents of this file!
 */

import { BaseSDK } from "./base.ts";

import { projectGroupsModule } from "./modules/projectGroups.ts";
import { projectsModule } from "./modules/projects.ts";
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
import { streamsModule } from "./modules/streams.ts";
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
        "projectGroups",
        "projects",
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
    
    static projectGroups = projectGroupsModule(this);
    static projects = projectsModule(this);
    static gitIntegrations = gitIntegrationsModule(this);
    static githubHooks = githubHooksModule(this);
    static templates = templatesModule(this);
    static variables = variablesModule(this);
    static home = homeModule(this);
    static index = indexModule(this);
    static agents = agentsModule(this);
    static networks = networksModule(this);
    static registries = registriesModule(this);
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
