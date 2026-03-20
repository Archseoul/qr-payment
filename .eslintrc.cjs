module.exports =  {
    root: true,
    extends: ["@nuxtjs/eslint-config-typescript"],
    rules: {
        'vue/v-slot-style': ['error', {
            'atComponent': 'v-slot',
            'default': 'v-slot',
            'named': 'longform',
        }],
        "@typescript-eslint/consistent-type-imports": "error",
    }
}
