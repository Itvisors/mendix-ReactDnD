module.exports = ({ configDefaultConfig }) => {
    for (const config of configDefaultConfig) {
        if (config.external) config.external[1] = /^react$/;
    }
    return configDefaultConfig;
};
