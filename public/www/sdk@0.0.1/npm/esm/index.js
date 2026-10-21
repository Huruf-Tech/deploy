/**
 * Copyright © Huruf Tech 2026
 *
 * This is a generated file. Do not edit the contents of this file!
 */
var _a;
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
    static getModuleNames() {
        return this._moduleNames;
    }
    static getModule(name) {
        if (!this.getModuleNames().includes(name)) {
            throw new Error(`Module not found: ${name}`);
        }
        return this[name];
    }
    static hasModule(name) {
        return this.getModuleNames().includes(name);
    }
    static getMetadata(module) {
        if (typeof module === "object") {
            return this._moduleMetadata.get(module);
        }
        return this._moduleMetadata.get(this.getModule(module));
    }
    static hasMetadata(module) {
        try {
            if (typeof module === "object") {
                return this._moduleMetadata.has(module);
            }
            return this._moduleMetadata.has(this.getModule(module));
        }
        catch {
            return false;
        }
    }
    static getGroup(module) {
        if (typeof module === "object") {
            return this._moduleGroup.get(module);
        }
        return this._moduleGroup.get(this.getModule(module));
    }
    static hasGroup(module) {
        try {
            if (typeof module === "object") {
                return this._moduleGroup.has(module);
            }
            if (!this.hasModule(module)) {
                return [...this._moduleGroup.values()].includes(module);
            }
            return this._moduleGroup.has(this.getModule(module));
        }
        catch {
            return false;
        }
    }
    static listActions(moduleName) {
        const actions = (() => {
            if (this._actionsList)
                return this._actionsList;
            const unpackModules = [];
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
_a = ThunderSDK;
Object.defineProperty(ThunderSDK, "_moduleNames", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: [
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
    ]
});
Object.defineProperty(ThunderSDK, "home", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: homeModule(_a)
});
Object.defineProperty(ThunderSDK, "index", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: indexModule(_a)
});
Object.defineProperty(ThunderSDK, "agents", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: agentsModule(_a)
});
Object.defineProperty(ThunderSDK, "servers", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: serversModule(_a)
});
Object.defineProperty(ThunderSDK, "streams", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: streamsModule(_a)
});
Object.defineProperty(ThunderSDK, "wellKnown", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: wellKnownModule(_a)
});
Object.defineProperty(ThunderSDK, "accessControl", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: accessControlModule(_a)
});
Object.defineProperty(ThunderSDK, "accessControlPolicies", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: accessControlPoliciesModule(_a)
});
Object.defineProperty(ThunderSDK, "apiKeys", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: apiKeysModule(_a)
});
Object.defineProperty(ThunderSDK, "auth", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: authModule(_a)
});
Object.defineProperty(ThunderSDK, "envs", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: envsModule(_a)
});
Object.defineProperty(ThunderSDK, "imageKit", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: imageKitModule(_a)
});
Object.defineProperty(ThunderSDK, "me", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: meModule(_a)
});
Object.defineProperty(ThunderSDK, "oauth", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: oauthModule(_a)
});
Object.defineProperty(ThunderSDK, "oauthClients", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: oauthClientsModule(_a)
});
Object.defineProperty(ThunderSDK, "tenantInvites", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: tenantInvitesModule(_a)
});
Object.defineProperty(ThunderSDK, "tenantMembers", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: tenantMembersModule(_a)
});
Object.defineProperty(ThunderSDK, "tenantMemberships", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: tenantMembershipsModule(_a)
});
Object.defineProperty(ThunderSDK, "tenants", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: tenantsModule(_a)
});
Object.defineProperty(ThunderSDK, "users", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: usersModule(_a)
});
Object.defineProperty(ThunderSDK, "walletLedgers", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: walletLedgersModule(_a)
});
Object.defineProperty(ThunderSDK, "wallets", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: walletsModule(_a)
});
Object.defineProperty(ThunderSDK, "plugins", {
    enumerable: true,
    configurable: true,
    writable: true,
    value: {
        essentials: essentialsEntry,
    }
});
