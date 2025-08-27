import { defineStore } from "pinia";
import { $__ } from "../i18n";
import { APIClient } from "../fetch/api-client.js";

export const useCircRulesStore = defineStore("circRules", {
    state: () => ({
        itemTypes: [],
        letters: [],
        libraries: [],
        patronCategories: [],
    }),
    actions: {
        async getItemTypes() {
            const client = APIClient.item;
            let itemTypes = [];
            try {
                itemTypes = await client.itemTypes.getAll();
            } catch (e) {
                // TODO: handle e
            }
            itemTypes.unshift({
                item_type_id: "*",
                description: $__("Default rule for all item types"),
            });
            this.itemTypes = itemTypes;
        },
        async getLibraries() {
            const client = APIClient.library;
            let libraries = [];
            try {
                libraries = await client.libraries.getAll();
            } catch (e) {
                // TODO: handle e
            }
            libraries.unshift({
                library_id: "*",
                name: $__("Default rule for all libraries"),
            });
            this.libraries = libraries;
        },
        async getPatronCategories() {
            const client = APIClient.patron;
            let patronCategories = [];
            try {
                patronCategories = await client.patronCategories.getAll();
            } catch (e) {
                // TODO: handle e
            }
            patronCategories.unshift({
                patron_category_id: "*",
                name: $__("Default rule for all categories"),
            });
            this.patronCategories = patronCategories;
        },
        handleContext(value, data, type, displayProperty = "name") {
            const item = data.find(item => item[type] === value);
            return item[displayProperty];
        },
        splitCircRulesByTriggerNumber(ruleSets) {
            const ruleSuffixes = [
                "delay",
                "notice",
                "mtt",
                "restrict",
                "ruleset_exists_in_db",
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
