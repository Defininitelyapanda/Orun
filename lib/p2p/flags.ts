export type P2PFeatureFlags = {
  enabled: boolean;
  adminEnabled: boolean;
  browserEnabled: boolean;
  diagnosticsEnabled: boolean;
};

type FlagEnvironment = Record<string, string | undefined>;

const enabled = (value: string | undefined, fallback: boolean) => value === "true" || (value === undefined && fallback);

export function readP2PFeatureFlags(env: FlagEnvironment = process.env): P2PFeatureFlags {
  const development = env.NODE_ENV === "development";
  return {
    enabled: enabled(env.ORUN_P2P_ENABLED, development),
    adminEnabled: enabled(env.ORUN_P2P_ADMIN_ENABLED, development),
    browserEnabled: enabled(env.ORUN_P2P_BROWSER_ENABLED, development),
    diagnosticsEnabled: enabled(env.ORUN_P2P_DIAGNOSTICS_ENABLED, development),
  };
}
