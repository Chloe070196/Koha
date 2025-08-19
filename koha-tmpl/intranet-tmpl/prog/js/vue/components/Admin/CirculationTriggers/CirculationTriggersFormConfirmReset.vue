<template>
    <div class="modal-content">
        <form @submit="resetCircRule($event)">
            <div class="modal-header">
                <h1 class="modal-title">
                    {{ $__("Confirm circulation rule set reset") }}
                </h1>
                <router-link
                    class="btn-close"
                    type="button"
                    :to="{
                        name: 'CirculationTriggersList',
                    }"
                ></router-link>
            </div>
            <div class="modal-body">
                <fieldset class="rows">
                    <div class="page-section bg-info">
                        <p>
                            {{
                                $__(
                                    "Resetting this rule set for the chosen context will have an impact on all the contexts that used to fall back on this rule set."
                                )
                            }}
                        </p>
                        <p>
                            {{
                                $__(
                                    "To better understand which contexts will be affected, use 'Display all patron categories and items types.' on the circulations triggers page."
                                )
                            }}
                        </p>
                    </div>
                    <legend>{{ $__("Trigger context") }}</legend>
                    <ol v-if="initialized">
                        <li>
                            <p>
                                <strong>{{ $__("Library") }}:</strong>
                            </p>
                            <p id="library_id">{{ $__(libraryName) }}</p>
                        </li>
                        <li>
                            <p>
                                <strong>{{ $__("Patron category") }}:</strong>
                            </p>
                            <p id="patron_category_id">
                                {{ $__(categoryName) }}
                            </p>
                        </li>
                        <li>
                            <p>
                                <strong>{{ $__("Item type") }}:</strong>
                            </p>
                            <p id="item_type_id">{{ $__(itemTypeName) }}</p>
                        </li>
                    </ol>
                    <div v-else>
                        <p>{{ $__("Loading circulation context...") }}</p>
                    </div>
                </fieldset>

                <fieldset class="rows">
                    <legend>{{ $__("Rule set for reset") }}</legend>
                    <table>
                        <thead>
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
                        </thead>
                        <tbody v-if="initialized">
                            <tr>
                                <!-- Delay -->
                                <td>
                                    <span
                                        :class="{
                                            fallback: findEffectiveRule(
                                                ruleSetForReset,
                                                `overdue_${triggerNumber}_delay`
                                            ).isFallback,
                                        }"
                                    >
                                        {{
                                            findEffectiveRule(
                                                ruleSetForReset,
                                                `overdue_${triggerNumber}_delay`
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
                                                ruleSetForReset,
                                                `overdue_${
                                                    triggerNumber
                                                }_notice`
                                            ).isFallback,
                                        }"
                                    >
                                        {{
                                            handleNotice(
                                                findEffectiveRule(
                                                    ruleSetForReset,
                                                    `overdue_${
                                                        triggerNumber
                                                    }_notice`
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
                                                ruleSetForReset,
                                                `overdue_${triggerNumber}_mtt`
                                            ).isFallback,
                                        }"
                                    >
                                        {{
                                            findEffectiveRule(
                                                ruleSetForReset,
                                                `overdue_${
                                                    triggerNumber
                                                }_notice`
                                            ).value !== ""
                                                ? handleTransport(
                                                      findEffectiveRule(
                                                          ruleSetForReset,
                                                          `overdue_${
                                                              triggerNumber
                                                          }_mtt`
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
                                                ruleSetForReset,
                                                `overdue_${triggerNumber}_mtt`
                                            ).isFallback,
                                        }"
                                    >
                                        {{
                                            findEffectiveRule(
                                                ruleSetForReset,
                                                `overdue_${
                                                    triggerNumber
                                                }_notice`
                                            ).value !== ""
                                                ? handleTransport(
                                                      findEffectiveRule(
                                                          ruleSetForReset,
                                                          `overdue_${
                                                              triggerNumber
                                                          }_mtt`
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
                                                ruleSetForReset,
                                                `overdue_${triggerNumber}_mtt`
                                            ).isFallback,
                                        }"
                                    >
                                        {{
                                            findEffectiveRule(
                                                ruleSetForReset,
                                                `overdue_${
                                                    triggerNumber
                                                }_notice`
                                            ).value !== ""
                                                ? handleTransport(
                                                      findEffectiveRule(
                                                          ruleSetForReset,
                                                          `overdue_${
                                                              triggerNumber
                                                          }_mtt`
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
                                                ruleSetForReset,
                                                `overdue_${
                                                    triggerNumber
                                                }_restrict`
                                            ).isFallback,
                                        }"
                                    >
                                        {{
                                            handleRestrictions(
                                                findEffectiveRule(
                                                    ruleSetForReset,
                                                    `overdue_${
                                                        triggerNumber
                                                    }_restrict`
                                                ).value
                                            )
                                        }}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                        <tbody v-else>
                            <tr>
                                {{
                                    $__("Loading circulation rule set...")
                                }}
                            </tr>
                        </tbody>
                    </table>
                </fieldset>

                <fieldset class="rows" v-if="alertMessage">
                    <div class="alert alert-info">{{ alertMessage }}</div>
                </fieldset>
            </div>
            <div class="modal-footer">
                <ButtonSubmit text="Confirm" />
                <router-link
                    :to="{
                        name: 'CirculationTriggersList',
                    }"
                    >{{ $__("Cancel") }}</router-link
                >
            </div>
        </form>
    </div>
</template>

<script>
import { APIClient } from "../../../fetch/api-client.js";
import ButtonSubmit from "../../ButtonSubmit.vue";
import TriggerContext from "./TriggerContext.vue";
import { inject } from "vue";
import { storeToRefs } from "pinia";
import { isEqual, cloneDeep } from "lodash";

export default {
    setup() {
        const circRulesStore = inject("circRulesStore");
        const { letters } = storeToRefs(circRulesStore);
        return { letters };
    },
    data() {
        return {
            alertMessage: null,
            initialized: false,
            library_id: null,
            patron_category_id: null,
            item_type_id: null,
            libraryName: null,
            categoryName: null,
            itemTypeName: null,
            triggerNumber: null,
            ruleSetForReset: {
                item_type_id: "*",
                library_id: "*",
                patron_category_id: "*",
                delay: null,
                notice: null,
                mtt: null,
                restrict: null,
            },
        };
    },
    beforeRouteEnter(to, from, next) {
        next(vm => {
            const { query } = to;
            vm.getCircRuleSetForReset(query).then(() =>
                vm
                    .getLibraryName()
                    .then(() =>
                        vm
                            .getCategoryName()
                            .then(() =>
                                vm
                                    .getItemTypeName()
                                    .then(() => (vm.initialized = true))
                            )
                    )
            );
        });
    },
    // TODO: determine which methods will be needed, limit amount of code repetition, consider extracting to circRuleStore
    methods: {
        async resetCircRule(e) {
            //TODO: convert this draft into functional code
            e.preventDefault();

            // prevent race condition related edit conflicts
            // if any changes are detected, inform the user, display the new values and go back to editing

            if (await this.checkForChanges()) {
                this.alertMessage =
                    "The ruleset for the selected trigger context could not be reset as it was updated elsewhere. Please see the updated trigger below.";
                // reload the form components that have changed, remain in edit mode
                this.$router.push({
                    path: "/cgi-bin/koha/admin/circulation_triggers/reset",
                    query: {
                        ...this.ruleSetForReset.context,
                        triggerNumber: this.triggerNumber,
                    },
                });
                return;
            }

            const circRule = { context: this.ruleSetForReset.context };

            if (
                this.ruleSetForReset[`overdue_${this.triggerNumber}_delay`] !==
                null
            ) {
                circRule[`overdue_${this.triggerNumber}_delay`] = null;
            }
            if (
                this.ruleSetForReset[`overdue_${this.triggerNumber}_notice`] !==
                null
            ) {
                circRule[`overdue_${this.triggerNumber}_notice`] = null;
            }
            if (
                this.ruleSetForReset[
                    `overdue_${this.triggerNumber}_restrict`
                ] !== null
            ) {
                circRule[`overdue_${this.triggerNumber}_restrict`] = null;
            }
            if (
                this.ruleSetForReset[`overdue_${this.triggerNumber}_mtt`] !==
                null
            ) {
                circRule[`overdue_${this.triggerNumber}_mtt`] = null;
            }
            circRule[`overdue_${this.triggerNumber}_ruleset_exists_in_db`] = null;

            try {
                const client = APIClient.circRule;
                await client.circRules.update(circRule);
                await this.$router.push({
                    name: "CirculationTriggersList",
                    query: { trigger: this.triggerNumber },
                });
                this.$router.go(0);
            } catch (e) {
                //TODO: handle e
            }
        },
        async checkForChanges() {
            const oldCircRule = cloneDeep(this.ruleSetForReset);
            await this.getCircRuleSetForReset({
                ...this.ruleSetForReset.context,
                triggerNumber: this.triggerNumber,
            });
            return !isEqual(oldCircRule, this.ruleSetForReset);
        },
        findEffectiveRule(ruleSet, key) {
            // FIXME: quick and dirty fix necessary due to routing being used for modals. Leaving in for POC, expecting full refactor before submission.
            if (!this.allCircRules || !Array.isArray(this.allCircRules)) {
                return { value: null, isFallback: true };
            }

            // Check if the current rule's value for the key is null
            if (ruleSet[key] === null) {
                // Filter rules to only those with non-null values for the specified key
                // and that are no excluded from the selected context
                const relevantRules = this.allCircRules.filter(
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
                    isFallback: ruleSet.isGeneratedFromDefault,
                };
            }
        },
        async getCategoryName() {
            if (this.patron_category_id === "*") {
                this.categoryName = "Default rule for all patron categories";
                return;
            }
            const client = APIClient.patron;
            let categories = await client.patronCategories.getAll();
            let category = categories.find(
                category =>
                    category.patron_category_id === this.patron_category_id
            );
            this.categoryName = category.name;
        },
        async getCircRuleSetForReset(query) {
            const {
                library_id,
                patron_category_id,
                item_type_id,
                triggerNumber,
            } = query;
            this.library_id = library_id;
            this.patron_category_id = patron_category_id;
            this.item_type_id = item_type_id;
            this.triggerNumber = triggerNumber;

            const client = APIClient.circRule;
            const result = await client.circRules.getAll(
                {},
                {
                    library_id: this.library_id,
                    patron_category_id: this.patron_category_id,
                    item_type_id: this.item_type_id,
                    effective: false,
                }
            );
            this.ruleSetForReset = result[0];
            this.allCircRules = query.allCircRules;
        },
        async getItemTypeName() {
            if (this.item_type_id === "*") {
                this.itemTypeName = "Default rule for all item types";
                return;
            }
            const client = APIClient.item;
            let types = await client.itemTypes.getAll();
            let type = types.find(
                type => type.item_type_id === this.item_type_id
            );
            this.itemTypeName = type.description;
        },
        async getLibraryName() {
            if (this.library_id === "*") {
                this.libraryName = "Default rule for all libraries";
                return;
            }
            const client = APIClient.library;
            let libraries = await client.libraries.get(this.library_id);
            this.libraryName = libraries.name;
        },
        handleContext(value, data, type, displayProperty = "name") {
            const item = data.find(item => item[type] === value);
            return item[displayProperty];
        },
        handleNotice(notice) {
            const letter = letters.find(letter => letter.code === notice);
            return letter ? letter.name : notice;
        },
        handleRestrictions(value) {
            return value === "1" ? this.$__("Yes") : this.$__("No");
        },
        handleTransport(value, type) {
            return value
                ? value.includes(type)
                    ? this.$__("Yes")
                    : this.$__("No")
                : "";
        },
    },
    components: { ButtonSubmit, TriggerContext },
};
</script>

<style scoped>
form li {
    display: flex;
    align-items: center;
}

.numeric-input-wrapper {
    position: relative;
    display: inline-block;
    width: 30%;
}

.input-with-clear {
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
}

.numeric-input {
    padding-right: 40px; /* Adjust to leave space for clear button */
    padding-left: 0.25em;
    padding-top: 2px;
    padding-bottom: 2px;
    width: 100%;
    border-radius: 4px;
    border: 1px solid #ccc;
    font-size: 16px;
    box-sizing: border-box;
    transition: border-color 0.2s ease;
}

.clear-btn {
    position: absolute;
    right: 22px; /* Adjust positioning */
    fill: var(--vs-controls-color);
    background-color: transparent;
    border: 0;
    font-size: 1.2em;
    color: #333;
    cursor: pointer;
    z-index: 2; /* Ensure it is above the input */
}

.button:active:hover,
.clear-btn:active:hover {
    background-color: #d4d4d4;
    border-color: #8c8c8c;
}

/* Chevron buttons container */
.chevron-buttons {
    display: flex;
    flex-direction: column;
    position: absolute;
    right: 0px;
    top: 0;
    bottom: 0;
    width: 16px;
    padding: 0px 5px 0px 2px;
    justify-content: center;
    z-index: 2;
}

/* Chevron button styles */
.increment-btn,
.decrement-btn {
    background-color: transparent;
    border: 0px solid #ccc;
    font-size: 10px;
    padding: 0px;
    cursor: pointer;
    color: rgba(60, 60, 60, 0.5);
    border-radius: 2px;
}

.increment-btn:hover,
.decrement-btn:hover {
    background-color: #ddd;
}

/* Hide the native increment/decrement buttons */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

input[type="number"] {
    -moz-appearance: textfield; /* For Firefox */
}

.numeric-input:focus,
.numeric-input:hover {
    border-color: #007bff; /* Match focus color of v-select */
    outline: none;
}

.dialog.alert
    fieldset:not(.bg-danger):not(.bg-warning):not(.bg-info):not(
        .bg-success
    ):not(.bg-primary):not(.action),
.dialog.error
    fieldset:not(.bg-danger):not(.bg-warning):not(.bg-info):not(
        .bg-success
    ):not(.bg-primary):not(.action) {
    margin: 0;
    background-color: rgba(255, 255, 255, 1);
}

.router-link-active {
    margin-left: 10px;
}
</style>
