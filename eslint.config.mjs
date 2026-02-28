import { fixupConfigRules } from "@eslint/compat";
import nextConfig from "eslint-config-next";

export default [
    ...fixupConfigRules(nextConfig),
    {
        rules: {
            "react/no-unescaped-entities": "off",
            "@next/next/no-img-element": "error"
        }
    },
    {
        ignores: [".next/*", "node_modules/*", "dist/*"]
    }
];
