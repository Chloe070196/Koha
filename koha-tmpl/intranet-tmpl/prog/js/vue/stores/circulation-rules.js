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
        findEffectiveRule(allRuleSets, ruleSet, key, triggerNumber) {
            if (!allRuleSets || !Array.isArray(allRuleSets)) {
                return { value: null, isFallback: true };
            }
            // Check if the current ruleSet's value for the key is null
            if (ruleSet[key] === null) {
                // Filter ruleSets to only those with non-null values for the specified key
                // and that are no excluded from the selected context
                const relevantRules = allRuleSets.filter(
                    ruleSet =>
                        ruleSet[key] !== null &&
                        ruleSet[key] !== undefined &&
                        (ruleSet.context.library_id ===
                            ruleSet.context.library_id ||
                            ruleSet.context.library_id === "*") &&
                        (ruleSet.context.patron_category_id ===
                            ruleSet.context.patron_category_id ||
                            ruleSet.context.patron_category_id === "*") &&
                        (ruleSet.context.item_type_id ===
                            ruleSet.context.item_type_id ||
                            ruleSet.context.item_type_id === "*")
                );

                // Function to calculate specificity score
                const getSpecificityScore = ruleSetContext => {
                    let score = 0;
                    if (
                        ruleSetContext.library_id !== "*" &&
                        ruleSetContext.library_id === ruleSet.context.library_id
                    )
                        score += 4;
                    if (
                        ruleSetContext.patron_category_id !== "*" &&
                        ruleSetContext.patron_category_id ===
                            ruleSet.context.patron_category_id
                    )
                        score += 2;
                    if (
                        ruleSetContext.item_type_id !== "*" &&
                        ruleSetContext.item_type_id ===
                            ruleSet.context.item_type_id
                    )
                        score += 1;
                    return score;
                };

                // Sort the ruleSets based on specificity score, descending
                const sortedRules = relevantRules.sort((a, b) => {
                    return (
                        getSpecificityScore(b.context) -
                        getSpecificityScore(a.context)
                    );
                });

                // If no ruleSet found, return null
                if (sortedRules.length === 0) {
                    return { value: null, isFallback: true };
                }

                // Get the value from the most specific ruleSet
                const bestRule = sortedRules[0];
                return { value: bestRule[key], isFallback: true };
            } else {
                // If the current ruleSet's value is not null, use it directly
                return {
                    value: ruleSet[key],
                    isFallback:
                        !ruleSet[
                            `overdue_${triggerNumber}_ruleset_exists_in_db`
                        ],
                };
            }
        },
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
        handleNotice(notice) {
            const letter = this.letters.find(letter => letter.code === notice);
            return letter ? letter.name : notice;
        },
        handleRestrictions(value) {
            return value === "1" ? $__("Yes") : $__("No");
        },
        handleTransport(value, type) {
            return value
                ? value.includes(type)
                    ? this.$__("Yes")
                    : this.$__("No")
                : "";
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
