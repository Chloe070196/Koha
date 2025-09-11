import { defineStore } from "pinia";
import { $__ } from "../i18n";
import { APIClient } from "../fetch/api-client.js";
import { isEqual } from "lodash";

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
        ruleSuffixes: ["delay", "notice", "mtt", "restrict", "has_rules"],
        transportTypes: [
            { code: "email", name: "Email" },
            { code: "sms", name: "SMS" },
            { code: "print", name: "Print" },
        ],
        regex: /overdue_(\d+)_has_rules/,
        // rule sets
        allDefaultLibraryRawRuleSets: [], // source of truth for default library
        allCurrentLibraryRawRuleSets: [], // source of truth for current library
        allEffectiveRuleSets: [], // main data set for display explicitly set rules for current library
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
                    ruleSet => ruleSet[`overdue_${i}_has_rules`] === "1"
                );

                if (!matchingRule) {
                    // Create a new ruleSet with the same context and null overdue_X_* keys
                    const placeholderRule = {
                        context: { ...context }, // Clone the context
                        [`overdue_${i}_delay`]: null,
                        [`overdue_${i}_notice`]: null,
                        [`overdue_${i}_mtt`]: null,
                        [`overdue_${i}_restrict`]: null,
                        [`overdue_${i}_has_rules`]: true,
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
                !Array.isArray(currentAndDefaultRawRuleSets) ||
                currentAndDefaultRawRuleSets.length === 0
            ) {
                return { value: null, isFallback: true };
            }
            // Check if the current ruleSet's value for the ruleSuffix is undefined
            const existingRule = currentAndDefaultRawRuleSets.find(
                ruleSet =>
                    ruleSet[`overdue_${triggerNumber}_${ruleSuffix}`] !==
                        undefined &&
                    ruleSet[`overdue_${triggerNumber}_${ruleSuffix}`] !==
                        null &&
                    ruleSet?.context.library_id ===
                        selectedRuleSet.context.library_id &&
                    ruleSet?.context.patron_category_id ===
                        selectedRuleSet.context.patron_category_id &&
                    ruleSet?.context.item_type_id ===
                        selectedRuleSet.context.item_type_id
            );

            // if handling 'has_rules', stop here
            if (ruleSuffix === "has_rules") {
                return {
                    value: existingRule?.[`overdue_${triggerNumber}_has_rules`],
                    isFallback:
                        !existingRule?.[`overdue_${triggerNumber}_has_rules`],
                };
            }

            // If the current ruleSet's value is not null, use it directly
            if (existingRule !== undefined) {
                return {
                    value: existingRule[
                        `overdue_${triggerNumber}_${ruleSuffix}`
                    ],
                    isFallback:
                        !existingRule[`overdue_${triggerNumber}_has_rules`],
                };
            }

            // Filter ruleSets to only those with non-null values for the specified ruleSuffix
            // and that are no excluded from the selected context
            const relevantRules = currentAndDefaultRawRuleSets.filter(
                ruleSet =>
                    ruleSet[`overdue_${triggerNumber}_${ruleSuffix}`] !==
                        undefined &&
                    ruleSet[`overdue_${triggerNumber}_${ruleSuffix}`] !==
                        null &&
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
        formatTriggerSpecificRuleSetForDisplay(ruleSet, triggerNumber) {
            const triggerSpecificRuleSet = {
                context: { ...ruleSet.context },
            };
            if (ruleSet[`overdue_${triggerNumber}_has_rules`] === null) {
                return false;
            }
            this.ruleSuffixes.forEach(ruleSuffix => {
                triggerSpecificRuleSet[
                    `overdue_${triggerNumber}_${ruleSuffix}`
                ] = this.findEffectiveRule(
                    triggerSpecificRuleSet,
                    ruleSuffix,
                    triggerNumber
                );
            });
            return triggerSpecificRuleSet;
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
        async getRawSelectedRuleSet(
            library_id = "*",
            patron_category_id = null,
            item_type_id = null
        ) {
            const context = {
                library_id,
            };
            item_type_id && (context.item_type_id = item_type_id);
            patron_category_id &&
                (context.patron_category_id = patron_category_id);
            const client = APIClient.circRule;
            let result;
            try {
                result = await client.circRules.getAll({}, context);
            } catch (e) {
                throw e;
            }
            const rawRuleSet = result[0];
            rawRuleSet.context = context;
            return rawRuleSet;
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
        hasConflict(oldRuleSet, newRuleSet, triggerNumber) {
            return (
                oldRuleSet.context.library_id !==
                    newRuleSet.context.library_id ||
                oldRuleSet.context.item_type_id !==
                    newRuleSet.context.item_type_id ||
                oldRuleSet.context.patron_category_id !==
                    newRuleSet.context.patron_category_id ||
                oldRuleSet[`overdue_${triggerNumber}_delay`] !==
                    newRuleSet[`overdue_${triggerNumber}_delay`] ||
                oldRuleSet[`overdue_${triggerNumber}_notice`] !==
                    newRuleSet[`overdue_${triggerNumber}_notice`] ||
                oldRuleSet[`overdue_${triggerNumber}_restrict`] !==
                    newRuleSet[`overdue_${triggerNumber}_restrict`] ||
                !isEqual(
                    oldRuleSet[`overdue_${triggerNumber}_mtt`],
                    newRuleSet[`overdue_${triggerNumber}_mtt`]
                )
            );
        },
        isOnlyRuleSetForTrigger(triggerNumber) {
            return (
                this.allCurrentLibraryRawRuleSets.filter(
                    ruleSet => ruleSet[`overdue_${triggerNumber}_has_rules`]
                ).length === 1
            );
        },
        isLastTrigger(triggerNumber) {
            return parseInt(triggerNumber) === this.triggerCount;
        },
        // FIXME: use updateTriggerCount instead
        setNumberOfTabs(triggerCount, tabCount) {
            if (triggerCount > tabCount) {
                return Array.from({ length: triggerCount }, (_, i) => i + 1);
            }
            return tabCount;
        },
        setTriggerValues(
            ruleSets,
            selectedRuleSet,
            triggerNumber,
            context = null
        ) {
            const i = parseInt(triggerNumber);
            const ruleSet = {
                item_type_id:
                    context?.item_type_id ??
                    ruleSets[i - 1]?.context?.item_type_id ??
                    "*",
                library_id:
                    context?.library_id ??
                    ruleSets[i - 1]?.context?.library_id ??
                    "*",
                patron_category_id:
                    context?.patron_category_id ??
                    ruleSets[i - 1]?.context?.patron_category_id ??
                    "*",
                delay: ruleSets[i - 1]?.[`overdue_${i}_delay`]?.value ?? null,
                notice: ruleSets[i - 1]?.[`overdue_${i}_notice`]?.value ?? null,
                mtt:
                    ruleSets[i - 1]?.[`overdue_${i}_mtt`]?.value?.split(",") ??
                    [],
                restrict:
                    ruleSets[i - 1]?.[`overdue_${i}_restrict`]?.value ?? null,
            };
            const fallbackRuleSet = {
                delay: this.findEffectiveRule(selectedRuleSet, "delay", i)
                    .value,
                notice: this.findEffectiveRule(selectedRuleSet, "notice", i)
                    .value,
                mtt: this.findEffectiveRule(selectedRuleSet, "mtt", i).value,
                restrict: this.findEffectiveRule(selectedRuleSet, "restrict", i)
                    .value,
            };
            return { ruleSet, fallbackRuleSet };
        },
        updateTriggerCount(ruleSet = this.allDefaultLibraryRawRuleSets[0]) {
            if (!this.allDefaultLibraryRawRuleSets[0]) {
                return;
            }
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
                    if (ruleSet[`overdue_${i}_has_rules`] === null) {
                        continue;
                    }
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
        setEffectiveTriggerFilteredRuleSet(ruleSet) {
            const effectiveTriggerFilteredRuleSets = [];
            for (let i = 1; i <= this.triggerCount; i++) {
                const triggerSpecificRuleSet =
                    this.formatTriggerSpecificRuleSetForDisplay(ruleSet, i);
                effectiveTriggerFilteredRuleSets.push(triggerSpecificRuleSet);
            }
            return effectiveTriggerFilteredRuleSets;
        },
        async updateCircRuleSets(existingRuleSet, triggerNumber) {
            const circRuleSet = { context: existingRuleSet.context };
            circRuleSet[`overdue_${triggerNumber}_delay`] =
                existingRuleSet[`overdue_${triggerNumber}_delay`];
            circRuleSet[`overdue_${triggerNumber}_notice`] =
                existingRuleSet[`overdue_${triggerNumber}_notice`];
            circRuleSet[`overdue_${triggerNumber}_restrict`] =
                existingRuleSet[`overdue_${triggerNumber}_restrict`];
            circRuleSet[`overdue_${triggerNumber}_mtt`] =
                existingRuleSet[`overdue_${triggerNumber}_mtt`];
            circRuleSet[`overdue_${triggerNumber}_has_rules`] =
                existingRuleSet[`overdue_${triggerNumber}_has_rules`];
            try {
                const client = APIClient.circRule;
                await client.circRules.update(circRuleSet);
            } catch (e) {
                //TODO: handle e
            }
        },
    },
});
