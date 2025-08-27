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
                    v-for="(ruleSet, i) in modal
                        ? filterCircRulesByContext(ruleSetBeingEdited)
                        : filterCircRulesByTabNumber(triggerNumber)"
                    :key="'ruleSet' + i"
                    :class="{
                        selected_rule_set:
                            modal && i + 1 === parseInt(triggerBeingEdited),
                    }"
                >
                    <td v-if="!modal" class="trigger_context">
                        {{
                            handleContext(
                                ruleSet.context.library_id,
                                libraries,
                                "library_id"
                            )
                        }}
                    </td>
                    <td v-if="!modal" class="trigger_context">
                        {{
                            handleContext(
                                ruleSet.context.patron_category_id,
                                patronCategories,
                                "patron_category_id"
                            )
                        }}
                    </td>
                    <td v-if="!modal" class="trigger_context border_right">
                        {{
                            handleContext(
                                ruleSet.context.item_type_id,
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
                                    ruleSet,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_delay`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                findEffectiveRule(
                                    ruleSet,
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
                                    ruleSet,
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
                                        ruleSet,
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
                                    ruleSet,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_mtt`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                findEffectiveRule(
                                    ruleSet,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_notice`,
                                    modal ? i + 1 : triggerNumber
                                ).value !== ""
                                    ? handleTransport(
                                          findEffectiveRule(
                                              ruleSet,
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
                                    ruleSet,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_mtt`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                findEffectiveRule(
                                    ruleSet,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_notice`
                                ).value !== ""
                                    ? handleTransport(
                                          findEffectiveRule(
                                              ruleSet,
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
                                    ruleSet,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_mtt`,
                                    modal ? i + 1 : triggerNumber
                                ).isFallback,
                            }"
                        >
                            {{
                                findEffectiveRule(
                                    ruleSet,
                                    `overdue_${
                                        modal ? i + 1 : triggerNumber
                                    }_notice`
                                ).value !== ""
                                    ? handleTransport(
                                          findEffectiveRule(
                                              ruleSet,
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
                                    ruleSet,
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
                                        ruleSet,
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
                                    library_id: ruleSet.context.library_id,
                                    item_type_id: ruleSet.context.item_type_id,
                                    patron_category_id:
                                        ruleSet.context.patron_category_id,
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
                                ruleSet[
                                    `overdue_${modal ? i + 1 : triggerNumber}_ruleset_exists_in_db`
                                ]
                            "
                            :to="{
                                name: 'CirculationTriggersFormConfirmReset',
                                query: {
                                    library_id: ruleSet.context.library_id,
                                    item_type_id: ruleSet.context.item_type_id,
                                    patron_category_id:
                                        ruleSet.context.patron_category_id,
                                    triggerNumber: triggerNumber,
                                    allCircRules: allCircRuleSetsForTrigger,
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
                                        ruleSetBeingEdited.context.library_id,
                                    item_type_id:
                                        ruleSetBeingEdited.context.item_type_id,
                                    patron_category_id:
                                        ruleSetBeingEdited.context
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
        "contextSpecificCircRuleSets",
        "allCircRuleSetsForTrigger",
        "triggerNumber",
        "modal",
        "ruleSetBeingEdited",
        "triggerBeingEdited",
        "patronCategories",
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

            // Filter ruleSets that match the context
            const contextRuleSets = this.contextSpecificCircRuleSets.filter(
                ruleSet =>
                    ruleSet.context.item_type_id === context.item_type_id &&
                    ruleSet.context.patron_category_id ===
                        context.patron_category_id &&
                    ruleSet.context.library_id === context.library_id
            );

            // Calculate the number of 'overdue_X_' triggers in the effectiveRule
            const regex = /overdue_(\d+)_ruleset_exists_in_db/;
            this.numberOfTriggers = Object.keys(effectiveRule).filter(
                key => regex.test(key) && effectiveRule[key] !== null
            ).length;

            // Shortcut for the case where no triggers exist yet
            if (this.numberOfTriggers === 0) {
                return undefined;
            }
            // // Ensure there is one contextRule per 'X' from 1 to numberOfTriggers
            for (let i = 1; i <= this.numberOfTriggers; i++) {
                // Check if there's already a ruleSet for overdue_X_ in contextRuleSets
                const matchingRuleIndex = contextRuleSets.findIndex(
                    ruleSet =>
                        ruleSet[`overdue_${i}_ruleset_exists_in_db`] !== "0"
                );

                if (matchingRuleIndex === -1) {
                    // Create a new ruleSet with the same context and null overdue_X_* keys
                    const newRule = {
                        context: { ...context }, // Clone the context
                        [`overdue_${i}_delay`]: null,
                        [`overdue_${i}_notice`]: null,
                        [`overdue_${i}_mtt`]: null,
                        [`overdue_${i}_restrict`]: null,
                        [`overdue_${i}_ruleset_exists_in_db`]: false,
                    };
                    // Add the new ruleSet to contextRuleSets
                    contextRuleSets.push(cloneDeep(newRule));
                    continue;
                }

                const updatedRuleSet = {
                    ...contextRuleSets[matchingRuleIndex],
                    [`overdue_${i}_ruleset_exists_in_db`]:
                        contextRuleSets[matchingRuleIndex][
                            `overdue_${i}_delay`
                        ] !== null ||
                        contextRuleSets[matchingRuleIndex][
                            `overdue_${i}_notice`
                        ] !== null ||
                        contextRuleSets[matchingRuleIndex][
                            `overdue_${i}_mtt`
                        ] !== null ||
                        contextRuleSets[matchingRuleIndex][
                            `overdue_${i}_restrict`
                        ] !== null,
                };
                contextRuleSets.splice(matchingRuleIndex, 1, updatedRuleSet);
                // console.log('updated contextRuleSets: ', contextRuleSets)
            }

            // Sort contextRuleSets by the 'X' value in 'overdue_X_delay'
            contextRuleSets.sort((a, b) => {
                const getX = ruleSet => {
                    const match = Object.keys(ruleSet).find(key =>
                        regex.test(key)
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
        handleNotice(notice) {
            const letter = this.letters.find(letter => letter.code === notice);
            return letter ? letter.name : notice;
        },
        findEffectiveRule(ruleSet, key, triggerNumber) {
            // Check if the current ruleSet's value for the key is null
            if (ruleSet[key] === null) {
                // Filter ruleSets to only those with non-null values for the specified key
                // and that are no excluded from the selected context
                const relevantRules = this.allCircRuleSetsForTrigger.filter(
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
    },
};
</script>

<style scoped>
.selected_rule_set > td {
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
