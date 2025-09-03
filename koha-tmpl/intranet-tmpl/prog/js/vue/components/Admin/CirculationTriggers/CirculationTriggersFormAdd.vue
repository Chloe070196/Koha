<template>
    <form
        v-if="initialized"
        class="modal-content"
        id="circulation-trigger-form-add"
        @submit="addCircRule($event)"
    >
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
            <div
                class="page-section bg-info"
                v-if="effectiveTriggerFilteredRuleSets.length"
            >
                <h2>{{ $__("Circulation context") }}</h2>
                <TriggerContext :ruleSetInfo="ruleSetInfo" />
            </div>
            <fieldset class="rows">
                <legend>{{ $__("Confirm trigger context") }}</legend>
                <ol>
                    <li>
                        <label for="library_id" class="required"
                            >{{ $__("Library") }}:</label
                        >
                        <v-select
                            id="library_id"
                            v-model="newRule.library_id"
                            label="name"
                            :reduce="lib => lib.library_id"
                            :options="libraries"
                            @update:modelValue="handleContextChange($event)"
                            :disabled="editMode !== 'confirmContext'"
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    :required="!newRule.library_id"
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
                            v-model="newRule.patron_category_id"
                            label="name"
                            :reduce="cat => cat.patron_category_id"
                            :options="patronCategories"
                            @update:modelValue="handleContextChange($event)"
                            :disabled="editMode !== 'confirmContext'"
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    :required="!newRule.patron_category_id"
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
                            v-model="newRule.item_type_id"
                            label="description"
                            :reduce="type => type.item_type_id"
                            :options="itemTypes"
                            @update:modelValue="handleContextChange($event)"
                            :disabled="editMode !== 'confirmContext'"
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    :required="!newRule.item_type_id"
                                    class="vs__search"
                                    v-bind="attributes"
                                    v-on="events"
                                />
                            </template>
                        </v-select>
                        <span class="required">{{ $__("Required") }}</span>
                    </li>
                </ol>
                <div v-if="editMode === 'confirmContext'">
                    <router-link
                        :to="{
                            name: 'CirculationTriggersSelectOrAdd',
                            query: {
                                library_id: newRule.library_id,
                                item_type_id: newRule.item_type_id,
                                patron_category_id: newRule.patron_category_id,
                            },
                        }"
                        class="btn btn-default btn-xs"
                        ><i class="fa-solid fa-pencil"></i>
                        {{ $__("Confirm context") }}</router-link
                    >
                </div>
                <div
                    class="page-section bg-warning-subtle"
                    v-if="
                        effectiveTriggerFilteredRuleSets.length &&
                        editMode !== 'confirmContext'
                    "
                >
                    <TriggersTable
                        :triggerNumber="newTriggerNumber"
                        :modal="true"
                        :ruleSets="effectiveTriggerFilteredRuleSets"
                        :ruleSetBeingEdited="ruleSetBeingEdited"
                        :triggerBeingEdited="triggerBeingEdited"
                    />
                </div>
            </fieldset>
            <fieldset class="rows" v-if="alertMessage">
                <div class="alert alert-info">{{ alertMessage }}</div>
            </fieldset>
            <fieldset
                class="rows"
                v-if="editMode === 'edit' || editMode === 'add'"
            >
                <legend v-if="editMode === 'add'">
                    {{ $__("Add new trigger") }}
                    {{ " " + newTriggerNumber }}
                </legend>
                <legend v-else>
                    {{ $__("Edit trigger") }} {{ " " + newTriggerNumber }}
                </legend>
                <ol>
                    <li>
                        <label for="overdue_delay">{{ $__("Delay") }}: </label>
                        <div class="numeric-input-wrapper">
                            <div class="input-with-clear">
                                <input
                                    @change="checkReadyForSubmission"
                                    id="overdue_delay"
                                    v-model="newRule.delay"
                                    type="number"
                                    :placeholder="fallbackRule.delay"
                                    :min="minDelay"
                                    :max="maxDelay"
                                    class="numeric-input"
                                />
                                <button
                                    v-if="
                                        newRule.delay !== null &&
                                        newRule.delay !== undefined
                                    "
                                    type="button"
                                    class="clear-btn"
                                    @click="newRule.delay = null"
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="10"
                                        height="10"
                                    >
                                        <path
                                            d="M6.895455 5l2.842897-2.842898c.348864-.348863.348864-.914488 0-1.263636L9.106534.261648c-.348864-.348864-.914489-.348864-1.263636 0L5 3.104545 2.157102.261648c-.348863-.348864-.914488-.348864-1.263636 0L.261648.893466c-.348864.348864-.348864.914489 0 1.263636L3.104545 5 .261648 7.842898c-.348864.348863-.348864.914488 0 1.263636l.631818.631818c.348864.348864.914773.348864 1.263636 0L5 6.895455l2.842898 2.842897c.348863.348864.914772.348864 1.263636 0l.631818-.631818c.348864-.348864.348864-.914489 0-1.263636L6.895455 5z"
                                        ></path>
                                    </svg>
                                </button>
                                <div class="chevron-buttons">
                                    <button
                                        type="button"
                                        class="increment-btn"
                                        @click="incrementDelay"
                                    >
                                        ▴
                                    </button>
                                    <button
                                        type="button"
                                        class="decrement-btn"
                                        @click="decrementDelay"
                                    >
                                        ▾
                                    </button>
                                </div>
                            </div>
                        </div>
                    </li>
                    <li>
                        <label for="restricts"
                            >{{ $__("Restricts checkouts") }}:</label
                        >
                        <div>
                            <input
                                @change="checkReadyForSubmission"
                                type="radio"
                                id="restricts-yes"
                                v-model="newRule.restrict"
                                :value="1"
                            />
                            {{ $__("Yes") }}
                            <input
                                @change="checkReadyForSubmission"
                                type="radio"
                                id="restricts-no"
                                v-model="newRule.restrict"
                                :value="0"
                            />
                            {{ $__("No") }}
                            <input
                                @change="checkReadyForSubmission"
                                type="radio"
                                id="restricts-fallback"
                                v-model="newRule.restrict"
                                :value="null"
                            />
                            {{ $__("Fallback to default") }}
                            <span v-if="fallbackRule.restrict !== null">
                                ({{
                                    fallbackRule.restrict === "1"
                                        ? $__("Yes")
                                        : $__("No")
                                }})
                            </span>
                        </div>
                    </li>
                </ol>
            </fieldset>
            <fieldset
                class="rows"
                v-if="editMode === 'edit' || editMode === 'add'"
            >
                <legend v-if="ruleSetInfo.triggerCount < newTriggerNumber">
                    {{ $__("Notice for trigger") }}
                    {{ " " + newTriggerNumber }}
                </legend>
                <legend v-else>
                    {{ $__("Edit notice for trigger") }}
                    {{ " " + newTriggerNumber }}
                </legend>
                <ol>
                    <li>
                        <label for="letter_code">{{ $__("Letter") }}:</label>
                        <v-select
                            id="letter_code"
                            v-model="newRule.notice"
                            label="name"
                            :reduce="type => type.code"
                            :options="filteredLetters"
                            @change="checkReadyForSubmission"
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    @change="checkReadyForSubmission"
                                    class="vs__search"
                                    v-bind="attributes"
                                    v-on="events"
                                    :placeholder="
                                        newRule.notice === null ||
                                        newRule.notice === undefined
                                            ? letters.find(
                                                  letter =>
                                                      letter.code ===
                                                      fallbackRule.notice
                                              )?.name || fallbackRule.notice
                                            : ''
                                    "
                                />
                            </template>
                        </v-select>
                    </li>
                    <li
                        v-if="
                            newRule.notice !== '' ||
                            ((newRule.notice === null ||
                                newRule.notice === undefined) &&
                                fallbackRule.notice !== '')
                        "
                    >
                        <label for="mtt">{{ $__("Transport type(s)") }}:</label>
                        <v-select
                            id="mtt"
                            v-model="newRule.mtt"
                            label="name"
                            :reduce="type => type.code"
                            :options="mtts"
                            multiple
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    @change="checkReadyForSubmission"
                                    class="vs__search"
                                    v-bind="attributes"
                                    v-on="events"
                                    :placeholder="
                                        newRule.mtt === null ||
                                        newRule.mtt === undefined ||
                                        newRule.mtt.length === 0
                                            ? fallbackRule.mtt
                                            : ''
                                    "
                                />
                            </template>
                        </v-select>
                    </li>
                </ol>
            </fieldset>
        </div>
        <div class="modal-footer">
            <ButtonSubmit
                v-if="editMode === 'edit' || editMode === 'add'"
                :disabled="!allowSubmission"
            />
            <router-link
                :to="{
                    name: 'CirculationTriggersList',
                }"
                >{{ $__("Cancel") }}</router-link
            >
        </div>
    </form>
    <div v-else>
        <p>{{ $__("Loading...") }}</p>
    </div>
</template>

<script>
import { APIClient } from "../../../fetch/api-client.js";
import TriggersTable from "./TriggersTable.vue";
import { inject } from "vue";
import { storeToRefs } from "pinia";
import ButtonSubmit from "../../ButtonSubmit.vue";
import TriggerContext from "./TriggerContext.vue";
import { isEqual, cloneDeep } from "lodash";

export default {
    setup() {
        const circRulesStore = inject("circRulesStore");
        const {
            getLibraries,
            getPatronCategories,
            getItemTypes,
            updateTriggerCount,
            filterCircRulesByContext,
            findEffectiveRule,
        } = circRulesStore;
        const {
            letters,
            libraries,
            itemTypes,
            patronCategories,
            regex,
            triggerCount,
            effectiveTriggerFilteredRuleSets,
        } = storeToRefs(circRulesStore);

        return {
            letters,
            itemTypes,
            libraries,
            regex,
            triggerCount,
            patronCategories,
            getLibraries,
            getPatronCategories,
            getItemTypes,
            updateTriggerCount,
            filterCircRulesByContext,
            findEffectiveRule,
            effectiveTriggerFilteredRuleSets,
        };
    },
    data() {
        return {
            initialized: false,
            newRule: {
                item_type_id: "*",
                library_id: "*",
                patron_category_id: "*",
                delay: null,
                notice: null,
                mtt: null,
                restrict: null,
            },
            fallbackRule: {
                item_type_id: "*",
                library_id: "*",
                patron_category_id: "*",
                delay: null,
                notice: null,
                mtt: null,
                restrict: null,
            },
            newTriggerNumber: 1,
            mtts: [
                { code: "email", name: "Email" },
                { code: "sms", name: "SMS" },
                { code: "print", name: "Print" },
            ],
            ruleSetInfo: {
                issuelength: null,
                decreaseloanholds: null,
                fine: null,
                chargeperiod: null,
                lengthunit: null,
                triggerCount: null,
            },
            editMode: false,
            ruleSetBeingEdited: null,
            triggerBeingEdited: null,
            minDelay: 0,
            maxDelay: Infinity,
            filteredLetters: [],
            alertMessage: null,
            allowSubmission: false,
        };
    },
    beforeRouteEnter(to, from, next) {
        next(async vm => {
            const { query } = to;
            await vm.checkForExistingRules(query);
            vm.checkReadyForSubmission();
            vm.initialized = true;
        });
    },
    methods: {
        async addCircRule(e) {
            e.preventDefault();

            const context = {
                library_id: this.newRule.library_id || "*",
                item_type_id: this.newRule.item_type_id || "*",
                patron_category_id: this.newRule.patron_category_id || "*",
            };

            // this.checkForExistingRules will reset this.newRule - prevent this from affecting submission
            const ruleSetToSubmit = cloneDeep(this.newRule);

            // prevent race condition related edit conflicts
            if (this.editMode === "edit") {
                // store the ruleSet as loaded initially
                const oldCircRule = cloneDeep(this.ruleSetBeingEdited);

                // refresh this.ruleSetBeingEdited so it matches the database
                const routeParams = this.newRule;
                routeParams.triggerNumber = this.newTriggerNumber;
                await this.setRulesBeingEdited(routeParams);

                // if any changes are detected, inform the user, display the new values and go back to editing
                if (!isEqual(oldCircRule, this.ruleSetBeingEdited)) {
                    this.updateTriggerCount(this.ruleSetBeingEdited);
                    this.newTriggerNumber =
                        this.editMode === "edit"
                            ? routeParams.triggerNumber
                            : this.triggerCount + 1;
                    // update the form so that up-to-date trigger data is displayed
                    this.assignTriggerValues(
                        this.effectiveTriggerFilteredRuleSets,
                        this.newTriggerNumber,
                        {
                            library_id:
                                this.ruleSetBeingEdited.context.library_id,
                            item_type_id:
                                this.ruleSetBeingEdited.context.item_type_id,
                            patron_category_id:
                                this.ruleSetBeingEdited.context
                                    .patron_category_id,
                        }
                    );
                    // prepare the alert message
                    this.alertMessage =
                        "Your changes could not be saved as this circulation trigger was updated elsewhere. Please see the updated trigger below.";
                    // reload the form components that have changed, remain in edit mode
                    this.$router.push({
                        path: "/cgi-bin/koha/admin/circulation_triggers/edit",
                        query: {
                            ...context,
                            triggerNumber: this.newTriggerNumber,
                        },
                    });
                    return;
                }
            }

            const circRule = {
                context,
            };
            circRule[`overdue_${this.newTriggerNumber}_delay`] =
                ruleSetToSubmit.delay;
            circRule[`overdue_${this.newTriggerNumber}_notice`] =
                ruleSetToSubmit.notice;
            circRule[`overdue_${this.newTriggerNumber}_restrict`] =
                ruleSetToSubmit.restrict;
            circRule[`overdue_${this.newTriggerNumber}_mtt`] =
                ruleSetToSubmit.mtt && ruleSetToSubmit.mtt.length
                    ? ruleSetToSubmit.mtt.join(",")
                    : null;
            circRule[`overdue_${this.newTriggerNumber}_ruleset_exists_in_db`] =
                true;

            const client = APIClient.circRule;
            try {
                await client.circRules.update(circRule);
            } catch (e) {
                // handle e
            }

            await this.$router.replace({
                name: "CirculationTriggersList",
                query: { trigger: this.newTriggerNumber },
            });
            this.$router.go(0);
        },
        async handleContextChange() {
            await this.checkForExistingRules();
        },
        async checkForExistingRules(routeParams) {
            // We always pass library_id so we need to check for the existence of either item type or patron category
            this.editMode = this.$route.path.substring(
                this.$route.path.lastIndexOf("/") + 1
            );

            if (this.editMode === "edit") {
                this.triggerBeingEdited = routeParams.triggerNumber;
            }

            try {
                await this.setRulesBeingEdited(routeParams);
            } catch (e) {
                throw e;
            }
            this.updateTriggerCount(this.ruleSetBeingEdited);
            this.newTriggerNumber =
                this.editMode === "edit"
                    ? routeParams.triggerNumber
                    : this.triggerCount + 1;
            this.assignTriggerValues(
                this.effectiveTriggerFilteredRuleSets,
                this.newTriggerNumber,
                {
                    library_id: this.ruleSetBeingEdited.context.library_id,
                    item_type_id: this.ruleSetBeingEdited.context.item_type_id,
                    patron_category_id:
                        this.ruleSetBeingEdited.context.patron_category_id,
                }
            );
            this.ruleSetInfo = {
                issuelength: this.ruleSetBeingEdited.issuelength,
                decreaseloanholds: this.ruleSetBeingEdited.decreaseloanholds,
                fine: this.ruleSetBeingEdited.fine,
                chargeperiod: this.ruleSetBeingEdited.chargeperiod,
                lengthunit: this.ruleSetBeingEdited.lengthunit,
                triggerCount: this.triggerCount,
            };
            this.setMinDelay();
            this.setMaxDelay();
            this.setFilteredLetters();
        },
        async setRulesBeingEdited(routeParams) {
            const library_id =
                routeParams && routeParams.library_id
                    ? routeParams.library_id
                    : this.newRule.library_id || "*";
            const item_type_id =
                routeParams && routeParams.item_type_id
                    ? routeParams.item_type_id
                    : this.newRule.item_type_id || "*";
            const patron_category_id =
                routeParams && routeParams.patron_category_id
                    ? routeParams.patron_category_id
                    : this.newRule.patron_category_id || "*";
            const params = {
                library_id,
                item_type_id,
                patron_category_id,
            };

            const client = APIClient.circRule;
            let result;
            try {
                result = await client.circRules.getAll({}, params);
            } catch (e) {
                throw e;
            }
            this.ruleSetBeingEdited = result[0];
            this.ruleSetBeingEdited.context = params;
        },
        assignTriggerValues(ruleSet, triggerNumber, context = null) {
            const i = parseInt(triggerNumber);
            this.newRule = {
                item_type_id:
                    context?.item_type_id ??
                    ruleSet[i - 1]?.context?.item_type_id ??
                    "*",
                library_id:
                    context?.library_id ??
                    ruleSet[i - 1]?.context?.library_id ??
                    "*",
                patron_category_id:
                    context?.patron_category_id ??
                    ruleSet[i - 1]?.context?.patron_category_id ??
                    "*",
                delay: ruleSet[i - 1]?.[`overdue_${i}_delay`]?.value ?? null,
                notice: ruleSet[i - 1]?.[`overdue_${i}_notice`]?.value ?? null,
                mtt:
                    ruleSet[i - 1]?.[`overdue_${i}_mtt`]?.value?.split(",") ??
                    [],
                restrict:
                    ruleSet[i - 1]?.[`overdue_${i}_restrict`]?.value ?? null,
            };
            this.fallbackRule = {
                delay: this.findEffectiveRule(
                    this.ruleSetBeingEdited,
                    "delay",
                    i
                ).value,
                notice: this.findEffectiveRule(
                    this.ruleSetBeingEdited,
                    "notice",
                    i
                ).value,
                mtt: this.findEffectiveRule(this.ruleSetBeingEdited, "mtt", i)
                    .value,
                restrict: this.findEffectiveRule(
                    this.ruleSetBeingEdited,
                    "restrict",
                    i
                ).value,
            };
        },
        setMinDelay() {
            const priorTriggerNumber = parseInt(this.newTriggerNumber) - 1;
            this.minDelay = this.ruleSetBeingEdited[
                `overdue_${priorTriggerNumber}_delay`
            ]
                ? parseInt(
                      this.ruleSetBeingEdited[
                          `overdue_${priorTriggerNumber}_delay`
                      ]
                  ) + 1
                : 0;
        },
        setMaxDelay() {
            const nextTriggerNumber = parseInt(this.newTriggerNumber) + 1;
            this.maxDelay = this.ruleSetBeingEdited[
                `overdue_${nextTriggerNumber}_delay`
            ]
                ? parseInt(
                      this.ruleSetBeingEdited[
                          `overdue_${nextTriggerNumber}_delay`
                      ]
                  ) - 1
                : Infinity;
        },
        setFilteredLetters() {
            let library = this.newRule.library_id;
            const branchcodeMatches = letters.filter(
                letter => letter.branchcode === library
            );
            const emptyBranchcodeMatches = letters.filter(
                letter => letter.branchcode === ""
            );

            const uniqueCodes = [
                ...new Set(
                    [...branchcodeMatches, ...emptyBranchcodeMatches].map(
                        letter => letter.code
                    )
                ),
            ];

            this.filteredLetters = letters.filter(
                letter =>
                    uniqueCodes.includes(letter.code) &&
                    (letter.branchcode === library || letter.branchcode === "")
            );
        },
        incrementDelay() {
            // Check for minDelay and maxDelay
            const min = this.minDelay !== undefined ? this.minDelay : 1;
            const max = this.maxDelay !== undefined ? this.maxDelay : Infinity;

            // Set to minDelay if it's null or undefined
            if (
                this.newRule.delay === undefined ||
                this.newRule.delay === null
            ) {
                this.newRule.delay = min;
            }

            // Increment within the valid range
            else {
                this.newRule["delay"] = Math.min(this.newRule.delay + 1, max);
            }
            this.checkReadyForSubmission();
        },
        decrementDelay() {
            // Check for minDelay
            const min = this.minDelay !== undefined ? this.minDelay : 1;

            // Decrement only if greater than minDelay
            if (this.newRule.delay > min) {
                this.newRule.delay--;
            }
            this.checkReadyForSubmission();
        },
        checkReadyForSubmission() {
            this.allowSubmission =
                this.newRule.delay !== null ||
                this.newRule.notice !== null ||
                this.newRule.mtt.length !== 0 ||
                this.newRule.restrict !== null;
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
    components: { TriggersTable, ButtonSubmit, TriggerContext },
};
</script>

<style scoped>
#circulation-trigger-form-add {
    max-height: 90vh;
}

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
