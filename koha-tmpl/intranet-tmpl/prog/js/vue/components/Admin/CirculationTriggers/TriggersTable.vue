<template>
    <div class="page-section">
        <div v-if="!modal" class="page-section bg-info">
            {{
                $__(
                    "Bolid italic values denote fallback values where an override has not been set for the context."
                )
            }}
        </div>
        <table>
            <thead>
                <th v-if="!modal" class="trigger_context">
                    {{ $__("Library") }}
                </th>
                <th v-if="!modal" class="trigger_context">
                    {{ $__("Patron category") }}
                </th>
                <th v-if="!modal" class="trigger_context border_right">
                    {{ $__("Item type") }}
                </th>
                <th v-if="modal">
                    {{ $__("Trigger") }}
                </th>
                <th>
                    {{ $__("Delay") }}
                </th>
                <th>
                    {{ $__("Notice") }}
                </th>
                <th>
                    {{ $__("Email") }}
                </th>
                <th>
                    {{ $__("Print") }}
                </th>
                <th>
                    {{ $__("SMS") }}
                </th>
                <th>
                    {{ $__("Restricts checkouts") }}
                </th>
                <th>
                    {{ $__("Actions") }}
                </th>
            </thead>
            <tbody>
                <tr
                    v-for="(rule, i) in modal
                        ? filterCircRulesByContext(ruleBeingEdited)
                        : filterCircRulesByTabNumber(triggerNumber)"
                    :key="'rule' + i"
                    :class="{
                        selected_rule:
                            modal && i + 1 === parseInt(triggerBeingEdited),
                    }"
                >
                    <td v-if="!modal" class="trigger_context">
                        {{
                            handleContext(
                                rule.context.library_id,
                                libraries,
                                "library_id"
                            )
                        }}
                    </td>
                    <td v-if="!modal" class="trigger_context">
                        {{
                            handleContext(
                                rule.context.patron_category_id,
                                categories,
                                "patron_category_id"
                            )
                        }}
                    </td>
                    <td v-if="!modal" class="trigger_context border_right">
                        {{
                            handleContext(
                                rule.context.item_type_id,
                                itemTypes,
                                "item_type_id",
                                "description"
                            )
                        }}
                    </td>
                    <td v-if="modal">{{ i + 1 }}</td>

                    <!-- Delay -->
                    <td>
                        <span
                            :class="{
                                fallback: findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_delay`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_delay`,
                                    modal ? i + 1 : triggerNumber
                                ).value +
                                " " +
                                $__("days")
                            }}
                        </span>
                    </td>

                    <!-- Notice -->
                    <td>
                        <span
                            :class="{
                                fallback: findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_notice`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                handleNotice(
                                    findEffectiveRule(
                                        rule,
                                        `overdue_${
                                            modal ? i + 1 : triggerNumber
                                        }_notice`,
                                        modal ? i + 1 : triggerNumber
                                    ).value
                                )
                            }}
                        </span>
                    </td>

                    <!-- Email -->
                    <td>
                        <span
                            :class="{
                                fallback: findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_mtt`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_notice`,
                                    modal ? i + 1 : triggerNumber
                                ).value !== ""
                                    ? handleTransport(
                                          findEffectiveRule(
                                              rule,
                                              `overdue_${
                                                  modal ? i + 1 : triggerNumber
                                              }_mtt`,
                                              modal ? i + 1 : triggerNumber
                                          ).value,
                                          "email"
                                      )
                                    : ""
                            }}
                        </span>
                    </td>

                    <!-- Print -->
                    <td>
                        <span
                            :class="{
                                fallback: findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_mtt`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_notice`
                                ).value !== ""
                                    ? handleTransport(
                                          findEffectiveRule(
                                              rule,
                                              `overdue_${
                                                  modal ? i + 1 : triggerNumber
                                              }_mtt`,
                                              modal ? i + 1 : triggerNumber
                                          ).value,
                                          "print"
                                      )
                                    : ""
                            }}
                        </span>
                    </td>

                    <!-- SMS -->
                    <td>
                        <span
                            :class="{
                                fallback: findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_mtt`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_notice`
                                ).value !== ""
                                    ? handleTransport(
                                          findEffectiveRule(
                                              rule,
                                              `overdue_${
                                                  modal ? i + 1 : triggerNumber
                                              }_mtt`,
                                              modal ? i + 1 : triggerNumber
                                          ).value,
                                          "sms"
                                      )
                                    : ""
                            }}
                        </span>
                    </td>

                    <!-- Restricts Checkouts -->
                    <td>
                        <span
                            :class="{
                                fallback: findEffectiveRule(
                                    rule,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_restrict`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                handleRestrictions(
                                    findEffectiveRule(
                                        rule,
                                        `overdue_${
                                            modal ? i + 1 : triggerNumber
                                        }_restrict`,
                                        modal ? i + 1 : triggerNumber
                                    ).value
                                )
                            }}
                        </span>
                    </td>

                    <td class="actions">
                        <router-link
                            :to="{
                                name: 'CirculationTriggersFormEdit',
                                query: {
                                    library_id: rule.context.library_id,
                                    item_type_id: rule.context.item_type_id,
                                    patron_category_id:
                                        rule.context.patron_category_id,
                                    triggerNumber: modal
                                        ? i + 1
                                        : triggerNumber,
                                },
                            }"
                            class="btn btn-default btn-xs"
                            ><i class="fa-solid fa-pencil"></i>
                            {{ $__("Edit") }}</router-link
                        >
                        <router-link
                            v-if="
                                rule[
                                    `overdue_${modal ? i + 1 : triggerNumber}_ruleset_exists_in_db`
                                ]
                            "
                            :to="{
                                name: 'CirculationTriggersFormConfirmReset',
                                query: {
                                    library_id: rule.context.library_id,
                                    item_type_id: rule.context.item_type_id,
                                    patron_category_id:
                                        rule.context.patron_category_id,
                                    triggerNumber: triggerNumber,
                                    allCircRules: allCircRulesForTrigger,
                                },
                            }"
                            class="btn btn-default btn-xs"
                            ><i class="fa-solid fa-eraser"></i>
                            {{ $__("Reset") }}</router-link
                        >
                    </td>
                </tr>
                <tr v-if="modal">
                    <td colspan="7"></td>
                    <td class="actions">
                        <router-link
                            :to="{
                                name: 'CirculationTriggersFormAdd',
                                query: {
                                    library_id:
                                        ruleBeingEdited.context.library_id,
                                    item_type_id:
                                        ruleBeingEdited.context.item_type_id,
                                    patron_category_id:
                                        ruleBeingEdited.context
                                            .patron_category_id,
                                    triggerNumber: numberOfTriggers + 1,
                                },
                            }"
                            class="btn btn-default btn-xs"
                            ><i class="fa-solid fa-pencil"></i>
                            {{ $__("Add") }}</router-link
                        >
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<script>
import { cloneDeep } from "lodash";

export default {
    props: [
        "contextSpecificCircRules",
        "allCircRulesForTrigger",
        "triggerNumber",
        "modal",
        "ruleBeingEdited",
        "triggerBeingEdited",
        "categories",
        "itemTypes",
        "libraries",
        "letters",
    ],
    data() {
        return {
            numberOfTriggers: 0,
        };
    },
    methods: {
        handleContext(value, data, type, displayProperty = "name") {
            const item = data.find(item => item[type] === value);
            return item[displayProperty];
        },
        handleTransport(value, type) {
            return value
                ? value.includes(type)
                    ? this.$__("Yes")
                    : this.$__("No")
                : "";
        },
        handleRestrictions(value) {
            return value === "1" ? this.$__("Yes") : this.$__("No");
        },
        filterCircRulesByContext(effectiveRule) {
            const context = effectiveRule.context;

            // Filter rules that match the context
            const contextRules = this.contextSpecificCircRules.filter(
                rule =>
                    rule.context.item_type_id === context.item_type_id &&
                    rule.context.patron_category_id ===
                        context.patron_category_id &&
                    rule.context.library_id === context.library_id
            );

            // Calculate the number of 'overdue_X_' triggers in the effectiveRule
            const regex = /overdue_(\d+)_active/;
            this.numberOfTriggers = Object.keys(effectiveRule).filter(
                key => regex.test(key) && effectiveRule[key] !== null
            ).length;

            // Shortcut for the case where no triggers exist yet
            if (this.numberOfTriggers === 0) {
                return undefined;
            }
            // // Ensure there is one contextRule per 'X' from 1 to numberOfTriggers
            for (let i = 1; i <= this.numberOfTriggers; i++) {
                // Check if there's already a rule for overdue_X_ in contextRules
                const matchingRuleIndex = contextRules.findIndex(
                    rule => rule[`overdue_${i}_active`] !== undefined
                );

                if (matchingRuleIndex === -1) {
                    // Create a new rule with the same context and null overdue_X_* keys
                    const newRule = {
                        context: { ...context }, // Clone the context
                        [`overdue_${i}_delay`]: null,
                        [`overdue_${i}_notice`]: null,
                        [`overdue_${i}_mtt`]: null,
                        [`overdue_${i}_restrict`]: null,
                        [`overdue_${i}_ruleset_exists_in_db`]: false,
                    };
                    // Add the new rule to contextRules
                    contextRules.push(cloneDeep(newRule));
                    continue;
                }

                const updatedRuleSet = {
                    ...contextRules[matchingRuleIndex],
                    [`overdue_${i}_ruleset_exists_in_db`]:
                        contextRules[matchingRuleIndex][
                            `overdue_${i}_delay`
                        ] !== null ||
                        contextRules[matchingRuleIndex][
                            `overdue_${i}_notice`
                        ] !== null ||
                        contextRules[matchingRuleIndex][`overdue_${i}_mtt`] !==
                            null ||
                        contextRules[matchingRuleIndex][
                            `overdue_${i}_restrict`
                        ] !== null,
                };
                contextRules.splice(matchingRuleIndex, 1, updatedRuleSet);
                // console.log('updated contextRules: ', contextRules)
            }

            // Sort contextRules by the 'X' value in 'overdue_X_delay'
            contextRules.sort((a, b) => {
                const getX = rule => {
                    const match = Object.keys(rule).find(key =>
                        regex.test(key)
                    );
                    return match ? parseInt(match.match(/\d+/)[0], 10) : 0;
                };

                return getX(a) - getX(b);
            });

            return contextRules;
        },
        filterCircRulesByTabNumber(number) {
            return this.contextSpecificCircRules.filter(
                rule =>
                    rule.triggerNumber === number &&
                    (rule[`overdue_${number}_delay`] ||
                        rule[`overdue_${number}_notice`] ||
                        rule[`overdue_${number}_mtt`] ||
                        rule[`overdue_${number}_restrict`])
            );
        },
        handleNotice(notice) {
            const letter = this.letters.find(letter => letter.code === notice);
            return letter ? letter.name : notice;
        },
        findEffectiveRule(ruleSet, key, triggerNumber) {
            // Check if the current rule's value for the key is null
            if (ruleSet[key] === null) {
                // Filter rules to only those with non-null values for the specified key
                // and that are no excluded from the selected context
                const relevantRules = this.allCircRulesForTrigger.filter(
                    rule =>
                        rule[key] !== null &&
                        rule[key] !== undefined &&
                        (rule.context.library_id ===
                            ruleSet.context.library_id ||
                            rule.context.library_id === "*") &&
                        (rule.context.patron_category_id ===
                            ruleSet.context.patron_category_id ||
                            rule.context.patron_category_id === "*") &&
                        (rule.context.item_type_id ===
                            ruleSet.context.item_type_id ||
                            rule.context.item_type_id === "*")
                );

                // Function to calculate specificity score
                const getSpecificityScore = ruleContext => {
                    let score = 0;
                    if (
                        ruleContext.library_id !== "*" &&
                        ruleContext.library_id === ruleSet.context.library_id
                    )
                        score += 4;
                    if (
                        ruleContext.patron_category_id !== "*" &&
                        ruleContext.patron_category_id ===
                            ruleSet.context.patron_category_id
                    )
                        score += 2;
                    if (
                        ruleContext.item_type_id !== "*" &&
                        ruleContext.item_type_id ===
                            ruleSet.context.item_type_id
                    )
                        score += 1;
                    return score;
                };

                // Sort the rules based on specificity score, descending
                const sortedRules = relevantRules.sort((a, b) => {
                    return (
                        getSpecificityScore(b.context) -
                        getSpecificityScore(a.context)
                    );
                });

                // If no rule found, return null
                if (sortedRules.length === 0) {
                    return { value: null, isFallback: true };
                }

                // Get the value from the most specific rule
                const bestRule = sortedRules[0];
                return { value: bestRule[key], isFallback: true };
            } else {
                // If the current rule's value is not null, use it directly
                return {
                    value: ruleSet[key],
                    isFallback:
                        !ruleSet[
                            `overdue_${triggerNumber}_ruleset_exists_in_db`
                        ],
                };
            }
        },
        isDefaultRuleSet(ruleSet) {
            const overdueRulePattern = /^overdue_\d+_.+$/;

            // Collect all values of keys matching the pattern
            const overdueValues = Object.entries(ruleSet)
                .filter(([key]) => overdueRulePattern.test(key))
                .map(([, value]) => value);

            // Check if all matched values are null
            const allOverdueRulesNull =
                overdueValues.length > 0 &&
                overdueValues.every(value => value === null);

            // Return boolean
            return allOverdueRulesNull;
        },
    },
};
</script>

<style scoped>
.selected_rule > td {
    background-color: yellow !important;
}

.fallback {
    font-style: italic;
    font-weight: bold;
}

.actions a {
    margin-right: 5px;
}

td.trigger_context {
    color: black;
}

th.trigger_context {
    color: blue;
}

.border_right {
    border-right: solid 4px black;
}
</style>
