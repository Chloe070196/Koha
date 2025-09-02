import { defineStore } from "pinia";
import { $__ } from "../i18n";
import { APIClient } from "../fetch/api-client.js";

export const useCircRulesStore = defineStore("circRules", {
    // NOTES ON RULE SETS TYPES
    // exhaustive:  includes 'pure fallback' rules sets for contexts that no rules match. Format: [{overdue_X_<rule_name>: {value: mixed: isFallback: bool}}]
    // effective:   includes sets only for contexts for which one or more rule exists in the db. These sets will include fallbacks.
    // raw:         includes only the exact sets as they are found in the db Format: [{overdue_X_<rule_name>: <value>}}]
    state: () => ({
        // context
        currentLibraryId: "*",
        currentPatronCategoryId: null,
        currentItemTypeId: null,
        itemTypes: [],
        libraries: [],
        patronCategories: [],
        triggerCount: 0,
        // references
        letters: [],
        ruleSuffixes: [
            "delay",
            "notice",
            "mtt",
            "restrict",
            "ruleset_exists_in_db",
        ],
        transportTypes: ["email", "sms", "print"],
        regex: /overdue_(\d+)_ruleset_exists_in_db/,
        // rule sets
        // TODO: confirm which are useful to keep
        // TODO: make them trigger number specific
        // rawContextFilteredRuleSets: [],
        // rawTabFilteredRuleSets: [],
        // rawContextRuleSets: [],
        allDefaultLibraryRawRuleSets: [], // source of truth for default library
        allCurrentLibraryRawRuleSets: [], // source of truth for current library
        // effectiveContextFilteredRuleSets: [],
        effectiveTriggerFilteredRuleSets: [],
        // effectiveContextRuleSets: [],
        allEffectiveRuleSets: [], // main data set for display explicitly set rules for current library
        // exhaustiveEffectiveContextFilteredRuleSets: [],
        // exhaustiveEffectiveTabFilteredRuleSets: [],
        // exhaustiveEffectiveContextRuleSets: [],
        allExhaustiveEffectiveRuleSets: [], // main data set for display all applied rules for current library
    }),
    actions: {
        filterCircRulesByContext(effectiveRule) {
            const context = effectiveRule.context;

            // Filter ruleSets that match the context
            const contextRuleSets = this.allEffectiveRuleSets.filter(
                ruleSet =>
                    ruleSet.context.item_type_id === context.item_type_id &&
                    ruleSet.context.patron_category_id ===
                        context.patron_category_id &&
                    ruleSet.context.library_id === context.library_id
            );

            // Calculate the number of 'overdue_X_' triggers in the effectiveRule
            this.updateTriggerCount(effectiveRule);

            // Shortcut for the case where no triggers exist yet
            if (this.triggerCount === 0) {
                return undefined;
            }

            // Ensure there is one contextRule per 'X' from 1 to triggerCount
            for (let i = 1; i <= this.triggerCount; i++) {
                // Check if there's already a ruleSet for overdue_X_ in contextRuleSets
                const matchingRule = contextRuleSets.find(
                    ruleSet =>
                        ruleSet[`overdue_${i}_ruleset_exists_in_db`] === "1"
                );

                if (!matchingRule) {
                    // Create a new ruleSet with the same context and null overdue_X_* keys
                    const placeholderRule = {
                        context: { ...context }, // Clone the context
                        [`overdue_${i}_delay`]: null,
                        [`overdue_${i}_notice`]: null,
                        [`overdue_${i}_mtt`]: null,
                        [`overdue_${i}_restrict`]: null,
                        [`overdue_${i}_ruleset_exists_in_db`]: true,
                    };

                    // Add the new ruleSet to contextRuleSets
                    contextRuleSets.push(placeholderRule);
                }
            }

            // Sort contextRules by the 'X' value in 'overdue_X_delay'
            contextRuleSets.sort((a, b) => {
                const getX = ruleSet => {
                    const match = Object.keys(ruleSet).find(key =>
                        this.regex.test(key)
                    );
                    return match ? parseInt(match.match(/\d+/)[0], 10) : 0;
                };

                return getX(a) - getX(b);
            });

            return contextRuleSets;
        },
        filterCircRulesByTabNumber(number) {
            return this.contextSpecificCircRuleSets.filter(
                ruleSet =>
                    ruleSet.triggerNumber === number &&
                    (ruleSet[`overdue_${number}_delay`] ||
                        ruleSet[`overdue_${number}_notice`] ||
                        ruleSet[`overdue_${number}_mtt`] ||
                        ruleSet[`overdue_${number}_restrict`])
            );
        },
        findEffectiveRule(selectedRuleSet, ruleSuffix, triggerNumber) {
            const currentAndDefaultRawRuleSets = [
                ...this.allCurrentLibraryRawRuleSets,
                ...this.allDefaultLibraryRawRuleSets,
            ];
            if (
                !currentAndDefaultRawRuleSets ||
                !Array.isArray(currentAndDefaultRawRuleSets)
            ) {
                return { value: null, isFallback: true };
            }
            // Check if the current ruleSet's value for the ruleSuffix is undefined
            const existingRule = currentAndDefaultRawRuleSets.find(
                ruleSet =>
                    ruleSet[`overdue_${triggerNumber}_${ruleSuffix}`] !==
                        undefined &&
                    ruleSet?.context.library_id ===
                        selectedRuleSet.context.library_id &&
                    ruleSet?.context.patron_category_id ===
                        selectedRuleSet.context.patron_category_id &&
                    ruleSet?.context.item_type_id ===
                        selectedRuleSet.context.item_type_id
            );

            // If the current ruleSet's value is not null, use it directly
            if (existingRule !== undefined) {
                return {
                    value: existingRule[
                        `overdue_${triggerNumber}_${ruleSuffix}`
                    ],
                    isFallback:
                        !existingRule[
                            `overdue_${triggerNumber}_ruleset_exists_in_db`
                        ],
                };
            }

            // Filter ruleSets to only those with non-null values for the specified ruleSuffix
            // and that are no excluded from the selected context
            const relevantRules = currentAndDefaultRawRuleSets.filter(
                ruleSet =>
                    ruleSet[`overdue_${triggerNumber}_${ruleSuffix}`] !==
                        undefined &&
                    (ruleSet.context.library_id ===
                        selectedRuleSet.context.library_id ||
                        ruleSet.context.library_id === "*") &&
                    (ruleSet.context.patron_category_id ===
                        selectedRuleSet.context.patron_category_id ||
                        ruleSet.context.patron_category_id === "*") &&
                    (ruleSet.context.item_type_id ===
                        selectedRuleSet.context.item_type_id ||
                        ruleSet.context.item_type_id === "*")
            );

            // Function to calculate specificity score
            const getSpecificityScore = ruleSetContext => {
                let score = 0;
                if (
                    ruleSetContext.library_id !== "*" &&
                    ruleSetContext.library_id ===
                        selectedRuleSet.context.library_id
                )
                    score += 4;
                if (
                    ruleSetContext.patron_category_id !== "*" &&
                    ruleSetContext.patron_category_id ===
                        selectedRuleSet.context.patron_category_id
                )
                    score += 2;
                if (
                    ruleSetContext.item_type_id !== "*" &&
                    ruleSetContext.item_type_id ===
                        selectedRuleSet.context.item_type_id
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
            return {
                value: bestRule[`overdue_${triggerNumber}_${ruleSuffix}`],
                isFallback: true,
            };
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
        async getLetters() {
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
            if (!value) {
                return "";
            }
            return value.includes(type) ? $__("Yes") : $__("No");
        },
        splitCircRulesByTriggerNumber(ruleSets = this.allEffectiveRuleSets) {
            let numberOfTabs = [1];
            const ruleSetsPerTrigger = ruleSets.reduce((acc, ruleSet) => {
                this.updateTriggerCount(ruleSet);
                numberOfTabs = this.setNumberOfTabs(
                    this.triggerCount,
                    numberOfTabs
                );
                const triggerNumbers = Array.from(
                    { length: this.triggerCount },
                    (_, i) => i + 1
                );
                triggerNumbers.forEach(i => {
                    const ruleSetCopy = JSON.parse(JSON.stringify(ruleSet));
                    const rulesToDelete = triggerNumbers.filter(
                        num => num !== i
                    );
                    this.ruleSuffixes.forEach(suffix => {
                        rulesToDelete.forEach(number => {
                            delete ruleSetCopy[`overdue_${number}_${suffix}`];
                        });
                    });
                    ruleSetCopy.triggerNumber = i;
                    acc.push(ruleSetCopy);
                });
                return acc;
            }, []);

            this.effectiveTriggerFilteredRuleSets = ruleSetsPerTrigger;
        },
        // FIXME: use updateTriggerCount instead
        setNumberOfTabs(triggerCount, tabCount) {
            if (triggerCount > tabCount) {
                return Array.from({ length: triggerCount }, (_, i) => i + 1);
            }
            return tabCount;
        },
        updateTriggerCount(ruleSet = this.allDefaultLibraryRawRuleSets[0]) {
            this.triggerCount = Object.keys(ruleSet).filter(
                ruleSuffix =>
                    this.regex.test(ruleSuffix) && ruleSet[ruleSuffix] !== null
            ).length;
        },
        setAllExhaustiveEffectiveRuleSets() {
            // clear array
            this.allExhaustiveEffectiveRuleSets = [];
            // generate complete rule set list
            this.patronCategories.forEach(category => {
                this.itemTypes.forEach(itemType => {
                    const effectiveRuleSet = {
                        context: {
                            library_id: this.currentLibraryId,
                            patron_category_id: category.patron_category_id,
                            item_type_id: itemType.item_type_id,
                        },
                    };
                    for (let i = 1; i <= this.triggerCount; i++) {
                        this.ruleSuffixes.forEach(ruleSuffix => {
                            effectiveRuleSet[`overdue_${i}_${ruleSuffix}`] =
                                this.findEffectiveRule(
                                    effectiveRuleSet,
                                    ruleSuffix,
                                    i
                                );
                        });
                    }
                    this.allExhaustiveEffectiveRuleSets.push(effectiveRuleSet);
                });
            });
        },
        setAllEffectiveRuleSets() {
            // clear array
            this.allEffectiveRuleSets = [];
            // generate complete rule set list
            this.allCurrentLibraryRawRuleSets.forEach(ruleSet => {
                const effectiveRuleSet = {
                    context: { ...ruleSet.context },
                };
                for (let i = 1; i <= this.triggerCount; i++) {
                    this.ruleSuffixes.forEach(ruleSuffix => {
                        effectiveRuleSet[`overdue_${i}_${ruleSuffix}`] =
                            this.findEffectiveRule(
                                effectiveRuleSet,
                                ruleSuffix,
                                i
                            );
                    });
                }
                this.allEffectiveRuleSets.push(effectiveRuleSet);
            });
        },
        // updates the raw rules sets for both default and currently selected library
        async setAllRawRuleSets() {
            const client = APIClient.circRule;
            try {
                this.allDefaultLibraryRawRuleSets =
                    await client.circRules.getAll(
                        {},
                        { library_id: "*", effective: false }
                    );
                this.allCurrentLibraryRawRuleSets =
                    await client.circRules.getAll(
                        {},
                        { library_id: this.currentLibraryId, effective: false }
                    );
            } catch (e) {
                // TODO: handle error
            }
        },
    },
});
