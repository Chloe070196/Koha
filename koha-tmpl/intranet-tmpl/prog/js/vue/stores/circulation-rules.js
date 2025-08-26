import { defineStore } from "pinia";

export const useCircRulesStore = defineStore("circRules", {
    state: () => ({
        letters: [],
    }),
    actions: {
        splitCircRulesByTriggerNumber(ruleSets) {
            const ruleSuffixes = [
                "delay",
                "notice",
                "mtt",
                "restrict",
                "_ruleset_exists_in_db",
            ];
            let numberOfTabs = [1];
            const ruleSetsPerTrigger = ruleSets.reduce((acc, ruleSet) => {
                const regex = /overdue_(\d+)_ruleset_exists_in_db/;
                const numberOfTriggers = Object.keys(ruleSet).filter(ruleName =>
                    regex.test(ruleName)
                ).length;
                numberOfTabs = this.setNumberOfTabs(
                    numberOfTriggers,
                    numberOfTabs
                );
                const triggerNumbers = Array.from(
                    { length: numberOfTriggers },
                    (_, i) => i + 1
                );
                triggerNumbers.forEach(i => {
                    const ruleSetCopy = JSON.parse(JSON.stringify(ruleSet));
                    const rulesToDelete = triggerNumbers.filter(
                        num => num !== i
                    );
                    ruleSuffixes.forEach(suffix => {
                        rulesToDelete.forEach(number => {
                            delete ruleSetCopy[`overdue_${number}_${suffix}`];
                        });
                    });
                    ruleSetCopy.triggerNumber = i;
                    acc.push(ruleSetCopy);
                });
                return acc;
            }, []);

            return { numberOfTabs, ruleSetsPerTrigger };
        },
        setNumberOfTabs(triggerCount, tabCount) {
            if (triggerCount > tabCount) {
                return Array.from({ length: triggerCount }, (_, i) => i + 1);
            }
            return tabCount;
        },
    },
});
