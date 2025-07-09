<template>
    <div v-if="initialized" class="modal-content">
        <form @submit="deleteCircRule($event)">
            <div class="modal-header">
                <h1 class="modal-title">
                    {{ $__("Circulation Trigger Configuration") }}
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
                <div class="page-section bg-info" v-if="circRules.length">
                    <h2>{{ $__("Circulation context") }}</h2>
                    <TriggerContext :ruleInfo="ruleInfo" />
                </div>

                <fieldset class="rows">
                    <legend>{{ $__("Trigger context") }}</legend>
                    <ol>
                        <li>
                            <label for="library_id" class="required"
                                >{{ $__("Library") }}:</label
                            >
                            <v-select
                                id="library_id"
                                v-model="ruleForDeletion.library_id"
                                label="name"
                                :reduce="lib => lib.library_id"
                                :options="libraries"
                                @update:modelValue="handleContextChange($event)"
                                :disabled="editMode !== 'confirmContext'"
                            >
                                <template #search="{ attributes, events }">
                                    <input
                                        :required="!ruleForDeletion.library_id"
                                        class="vs__search"
                                        v-bind="attributes"
                                        v-on="events"
                                    />
                                </template>
                            </v-select>
                            <span class="required">{{ $__("Required") }}</span>
                        </li>
                        <li>
                            <label for="patron_category_id" class="required"
                                >{{ $__("Patron category") }}:</label
                            >
                            <v-select
                                id="patron_category_id"
                                v-model="ruleForDeletion.patron_category_id"
                                label="name"
                                :reduce="cat => cat.patron_category_id"
                                :options="categories"
                                @update:modelValue="handleContextChange($event)"
                                :disabled="editMode !== 'confirmContext'"
                            >
                                <template #search="{ attributes, events }">
                                    <input
                                        :required="
                                            !ruleForDeletion.patron_category_id
                                        "
                                        class="vs__search"
                                        v-bind="attributes"
                                        v-on="events"
                                    />
                                </template>
                            </v-select>
                            <span class="required">{{ $__("Required") }}</span>
                        </li>
                        <li>
                            <label for="item_type_id" class="required"
                                >{{ $__("Item type") }}:</label
                            >
                            <v-select
                                id="item_type_id"
                                v-model="ruleForDeletion.item_type_id"
                                label="description"
                                :reduce="type => type.item_type_id"
                                :options="itemTypes"
                                @update:modelValue="handleContextChange($event)"
                                :disabled="editMode !== 'confirmContext'"
                            >
                                <template #search="{ attributes, events }">
                                    <input
                                        :required="
                                            !ruleForDeletion.item_type_id
                                        "
                                        class="vs__search"
                                        v-bind="attributes"
                                        v-on="events"
                                    />
                                </template>
                            </v-select>
                            <span class="required">{{ $__("Required") }}</span>
                        </li>
                    </ol>
                </fieldset>

                <fieldset class="rows">
                    <legend>{{ $__("Trigger for deletion") }}</legend>
                    <table>
                        <thead></thead>
                        <tbody></tbody>
                    </table>
                </fieldset>

                <fieldset class="rows" v-if="alertMessage">
                    <div class="alert alert-info">{{ alertMessage }}</div>
                </fieldset>
            </div>
            <div class="modal-footer">
                <ButtonSubmit />
                <router-link
                    :to="{
                        name: 'CirculationTriggersList',
                    }"
                    >{{ $__("Cancel") }}</router-link
                >
                <router-link
                    :to="{
                        name: 'CirculationTriggersList',
                    }"
                    >{{ $__("Confirm") }}</router-link
                >
            </div>
        </form>
    </div>
    <div v-else>
        <p>{{ $__("Loading...") }}</p>
    </div>
</template>

<script>
import { APIClient } from "../../../fetch/api-client.js";
import { inject } from "vue";
import { storeToRefs } from "pinia";
import ButtonSubmit from "../../ButtonSubmit.vue";
import TriggerContext from "./TriggerContext.vue";
import { isEqual, cloneDeep } from "lodash";

export default {
    setup() {
        const circRulesStore = inject("circRulesStore");
        const { splitCircRulesByTriggerNumber } = circRulesStore;
        const { letters } = storeToRefs(circRulesStore);

        return {
            splitCircRulesByTriggerNumber,
            letters,
        };
    },
    data() {
        return {
            triggerNumber: 0,
            context: {
                library_id: 0,
                item_type_id: 0,
                patron_category_id: 0,
            },
            ruleForDeletion: {
                delay: null,
                notice: null,
                mtt: null,
                restrict: null,
                set_lost: null,
                charge_cost: null,
                mark_as_returned: null,
            },
            alertMessage: null,
            initialized: null,
        };
    },
    beforeRouteEnter(to, from, next) {
        next(vm => {
            // vm.getCircRules().then(() => {
            const { query } = to;
            vm.checkForExistingRules(query).then(() => (vm.initialized = true));
            // })
        });
    },
    methods: {
        async deleteCircRule(e) {
            e.preventDefault();

            // prevent race condition related edit conflicts

            // store the rule as loaded initially
            const oldCircRule = cloneDeep(this.ruleForDeletion);

            // refresh this.ruleForDeletion so it matches the database
            const routeParams = this.ruleForDeletion;
            routeParams.triggerNumber = this.triggerNumber;

            await this.setRulesForDeletion(routeParams);
            // if any changes are detected, inform the user, display the new values and go back to editing
            if (!isEqual(oldCircRule, this.ruleForDeletion)) {
                const regex = /overdue_(\d+)_delay/g;
                const numberOfTriggers = Object.keys(
                    this.ruleForDeletion
                ).filter(
                    key => regex.test(key) && this.ruleForDeletion[key] !== null
                ).length;

                // update the rule value so it matches db state
                // prepare the alert message
                this.alertMessage =
                    "The ruleset for the selected trigger context could not be deleted as it was update elsewhere. Please see the updated trigger below.";
                // reload the form components that have changed, remain in edit mode
                this.$router.push({
                    path: "/cgi-bin/koha/admin/circulation_triggers/delete",
                    query: {
                        ...context,
                        triggerNumber: this.triggerNumber,
                    },
                });
                return;
            }

            const circRule = {
                context,
                triggerNumber: this.triggerNumber,
            };

            const client = APIClient.circRule;
            await client.circRules.delete(circRule).then(
                () => {
                    this.$router
                        .push({
                            name: "CirculationTriggersList",
                            query: { trigger: this.triggerNumber },
                        })
                        .then(() => this.$router.go(0));
                },
                error => {}
            );
        },
        async setRulesForDeletion(routeParams) {
            const library_id =
                routeParams && routeParams.library_id
                    ? routeParams.library_id
                    : this.ruleForDeletion.library_id || "*";
            const item_type_id =
                routeParams && routeParams.item_type_id
                    ? routeParams.item_type_id
                    : this.ruleForDeletion.item_type_id || "*";
            const patron_category_id =
                routeParams && routeParams.patron_category_id
                    ? routeParams.patron_category_id
                    : this.ruleForDeletion.patron_category_id || "*";
            const params = {
                library_id,
                item_type_id,
                patron_category_id,
            };

            const client = APIClient.circRule;
            const promise = await client.circRules.getAll({}, params);
            this.ruleForDeletion = promise[0];
            this.ruleForDeletion.context = params;
        },
        async checkForExistingRules(routeParams) {
            // We always pass library_id so we need to check for the existence of either item type or patron category
            this.editMode = this.$route.path.substring(
                this.$route.path.lastIndexOf("/") + 1
            );

            try {
                await this.setRulesForDeletion(routeParams);
            } catch (e) {
                throw e;
            }

            const regex = /overdue_(\d+)_delay/g;
            const numberOfTriggers = Object.keys(this.ruleForDeletion).filter(
                key => regex.test(key) && this.ruleForDeletion[key] !== null
            ).length;
            const splitRules = this.filterCircRulesByContext(
                this.ruleForDeletion
            );
            this.triggerNumber =
                this.editMode === "edit"
                    ? routeParams.triggerNumber
                    : numberOfTriggers + 1;
            this.assignTriggerValues(splitRules, this.triggerNumber, {
                library_id: this.ruleForDeletion.context.library_id,
                item_type_id: this.ruleForDeletion.context.item_type_id,
                patron_category_id:
                    this.ruleForDeletion.context.patron_category_id,
            });
            this.ruleInfo = {
                issuelength: this.ruleForDeletion.issuelength,
                decreaseloanholds: this.ruleForDeletion.decreaseloanholds,
                fine: this.ruleForDeletion.fine,
                chargeperiod: this.ruleForDeletion.chargeperiod,
                lengthunit: this.ruleForDeletion.lengthunit,
                numberOfTriggers: numberOfTriggers,
            };
            this.setMinDelay();
            this.setMaxDelay();
            this.setFilteredLetters();
        },
        filterCircRulesByContext(effectiveRule) {
            const context = effectiveRule.context;

            // Filter rules that match the context
            let contextRules = this.circRules.filter(rule => {
                return Object.keys(context).every(key => {
                    return context[key] === rule.context[key];
                });
            });

            // Calculate the number of 'overdue_X_' triggers in the effectiveRule
            const regex = /overdue_(\d+)_delay/g;
            const numberOfTriggers = Object.keys(effectiveRule).filter(
                key => regex.test(key) && effectiveRule[key] !== null
            ).length;

            // Ensure there is one contextRule per 'X' from 1 to numberOfTriggers
            for (let i = 1; i <= numberOfTriggers; i++) {
                // Check if there's already a rule for overdue_X_ in contextRules
                const matchingRule = contextRules.find(
                    rule => rule[`overdue_${i}_delay`] !== undefined
                );

                if (!matchingRule) {
                    // Create a new rule with the same context and null overdue_X_* keys
                    const placeholderRule = {
                        context: { ...context }, // Clone the context
                        [`overdue_${i}_delay`]: null,
                        [`overdue_${i}_notice`]: null,
                        [`overdue_${i}_mtt`]: null,
                        [`overdue_${i}_restrict`]: null,
                        [`overdue_${i}_set_lost`]: null,
                        [`overdue_${i}_charge_cost`]: null,
                        [`overdue_${i}_mark_as_returned`]: null,
                    };

                    // Add the new rule to contextRules
                    contextRules.push(placeholderRule);
                }
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
        assignTriggerValues(rules, triggerNumber, context = null) {
            this.ruleForDeletion = {
                item_type_id: context
                    ? context.item_type_id
                    : rules[triggerNumber - 1].context.item_type_id || "*",
                library_id: context
                    ? context.library_id
                    : rules[triggerNumber - 1].context.library_id || "*",
                patron_category_id: context
                    ? context.patron_category_id
                    : rules[triggerNumber - 1].context.patron_category_id ||
                      "*",
                delay: rules[triggerNumber - 1]
                    ? rules[triggerNumber - 1][`overdue_${triggerNumber}_delay`]
                    : null,
                notice: rules[triggerNumber - 1]
                    ? rules[triggerNumber - 1][
                          `overdue_${triggerNumber}_notice`
                      ]
                    : null,
                mtt: rules[triggerNumber - 1]
                    ? rules[triggerNumber - 1][`overdue_${triggerNumber}_mtt`]
                        ? rules[triggerNumber - 1][
                              `overdue_${triggerNumber}_mtt`
                          ].split(",")
                        : []
                    : null,
                restrict: rules[triggerNumber - 1]
                    ? rules[triggerNumber - 1][
                          `overdue_${triggerNumber}_restrict`
                      ]
                    : null,
                set_lost: rules[triggerNumber - 1]
                    ? rules[triggerNumber - 1][
                          `overdue_${triggerNumber}_set_lost`
                      ]
                    : null,
                charge_cost: rules[triggerNumber - 1]
                    ? rules[triggerNumber - 1][
                          `overdue_${triggerNumber}_charge_cost`
                      ]
                    : null,
                mark_as_returned: rules[triggerNumber - 1]
                    ? rules[triggerNumber - 1][
                          `overdue_${triggerNumber}_mark_as_returned`
                      ]
                    : null,
            };
        },
    },
    watch: {
        $route: {
            immediate: true,
            handler: function (newVal, oldVal) {
                if (
                    oldVal &&
                    oldVal.query.triggerNumber &&
                    newVal.query.triggerNumber !== oldVal.query.triggerNumber
                ) {
                    this.$router.go(0);
                }
            },
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
