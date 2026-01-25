
// logTranslator.ts
// Helper to localize dynamic log strings using pattern matching

export const getLocalizedDescription = (desc: string, t: (key: string, options?: any) => string) => {
    // Regex patterns for dynamic mapping
    const patterns = [
        {
            regex: /System switched to (.*) mode/i,
            key: "actionLog.logs.systemSwitch",
            transform: (match: RegExpMatchArray) => ({ mode: t(`control.${match[1].toLowerCase()}`) || match[1] })
        },
        {
            regex: /System mode changed to (.*)/i,
            key: "actionLog.logs.systemSwitch",
            transform: (match: RegExpMatchArray) => ({ mode: t(`control.${match[1].toLowerCase()}`) || match[1] })
        },
        {
            regex: /Irrigation triggered – (\d+)L dispensed/i,
            key: "actionLog.logs.irrigationDispensed",
            transform: (match: RegExpMatchArray) => ({ amount: match[1] })
        },
        {
            regex: /Manual irrigation triggered – (\d+)L dispensed/i,
            key: "actionLog.logs.manualIrrigation",
            transform: (match: RegExpMatchArray) => ({ amount: match[1] })
        },
        {
            regex: /Fertilization skipped – rain expected/i,
            key: "actionLog.logs.fertilizationSkipped",
            transform: () => ({})
        },
        {
            regex: /Manual fertilization triggered – (.*) dispensed/i,
            key: "actionLog.logs.manualFertilization",
            transform: (match: RegExpMatchArray) => ({ blend: match[1] })
        },
        {
            regex: /NPK boost applied – (.*)/i,
            key: "actionLog.logs.fertilizationApplied",
            transform: (match: RegExpMatchArray) => ({ details: match[1] })
        }
    ];

    for (const pattern of patterns) {
        const match = desc.match(pattern.regex);
        if (match) {
            return t(pattern.key, pattern.transform(match));
        }
    }
    return desc; // Fallback to original string if no pattern matches
};

export const getLocalizedAction = (action: string, t: (key: string) => string) => {
    // Map known action titles
    if (action.includes("Irrigation Cycle")) return t("actionLog.types.irrigation");
    if (action.includes("Manual Irrigation")) return t("control.manualIrrigation");
    if (action.includes("Fertilization")) return t("actionLog.types.fertilization");
    if (action.includes("System Mode")) return t("control.systemMode");
    if (action.includes("Autonomous System")) return t("control.autonomous");
    if (action.includes("Manual System")) return t("control.manual");
    return action;
};
