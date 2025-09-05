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
                            v-model="ruleSet.context.library_id"
                            label="name"
                            :reduce="lib => lib.library_id"
                            :options="libraries"
                            @update:modelValue="handleContextChange($event)"
                            :disabled="editMode !== 'confirmContext'"
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    :required="!ruleSet.context.library_id"
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
                            v-model="ruleSet.context.patron_category_id"
                            label="name"
                            :reduce="cat => cat.patron_category_id"
                            :options="patronCategories"
                            @update:modelValue="handleContextChange($event)"
                            :disabled="editMode !== 'confirmContext'"
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    :required="
                                        !ruleSet.context.patron_category_id
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
                            v-model="ruleSet.context.item_type_id"
                            label="description"
                            :reduce="type => type.item_type_id"
                            :options="itemTypes"
                            @update:modelValue="handleContextChange($event)"
                            :disabled="editMode !== 'confirmContext'"
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    :required="!ruleSet.context.item_type_id"
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
                                library_id: ruleSet.context.library_id,
                                item_type_id: ruleSet.context.item_type_id,
                                patron_category_id:
                                    ruleSet.context.patron_category_id,
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
                        :triggerNumber="triggerNumber"
                        :modal="true"
                        :ruleSets="effectiveTriggerFilteredRuleSets"
                        :ruleSetBeingEdited="ruleSet"
                        :triggerBeingEdited="triggerBeingEdited"
                    />
                </div>
            </fieldset>
            <fieldset class="rows" v-if="alertMessage">
                <div class="alert alert-info">{{ alertMessage }}</div>
            </fieldset>
            <fieldset
                class="rows"
                v-if="
                    ruleSet[`overdue_${triggerNumber}_has_rules`] === '1' &&
                    (editMode === 'edit' || editMode === 'add')
                "
            >
                <legend v-if="editMode === 'add'">
                    {{ $__("Add new trigger") }}
                    {{ " " + triggerNumber }}
                </legend>
                <legend v-else>
                    {{ $__("Edit trigger") }} {{ " " + triggerNumber }}
                </legend>
                <ol>
                    <li>
                        <label for="overdue_delay">{{ $__("Delay") }}: </label>
                        <div class="numeric-input-wrapper">
                            <div class="input-with-clear">
                                <input
                                    @change="isReadyForSubmission"
                                    id="overdue_delay"
                                    v-model="
                                        ruleSet[
                                            `overdue_${triggerNumber}_delay`
                                        ]
                                    "
                                    type="number"
                                    :placeholder="
                                        fallbackRuleSet[
                                            `overdue_${triggerNumber}_delay`
                                        ]
                                    "
                                    :min="minDelay"
                                    :max="maxDelay"
                                    class="numeric-input"
                                />
                                <button
                                    v-if="
                                        ruleSet[
                                            `overdue_${triggerNumber}_delay`
                                        ] !== null &&
                                        ruleSet[
                                            `overdue_${triggerNumber}_delay`
                                        ] !== undefined
                                    "
                                    type="button"
                                    class="clear-btn"
                                    @click="
                                        ruleSet[
                                            `overdue_${triggerNumber}_delay`
                                        ] = null
                                    "
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
                                @change="isReadyForSubmission"
                                type="radio"
                                id="restricts-yes"
                                v-model="
                                    ruleSet[`overdue_${triggerNumber}_restrict`]
                                "
                                :value="1"
                            />
                            {{ $__("Yes") }}
                            <input
                                @change="isReadyForSubmission"
                                type="radio"
                                id="restricts-no"
                                v-model="
                                    ruleSet[`overdue_${triggerNumber}_restrict`]
                                "
                                :value="0"
                            />
                            {{ $__("No") }}
                            <input
                                @change="isReadyForSubmission"
                                type="radio"
                                id="restricts-fallback"
                                v-model="
                                    ruleSet[`overdue_${triggerNumber}_restrict`]
                                "
                                :value="null"
                            />
                            {{ $__("Fallback to default") }}
                            <span
                                v-if="
                                    fallbackRuleSet[
                                        `overdue_${triggerNumber}_restrict`
                                    ] !== null
                                "
                            >
                                ({{
                                    fallbackRuleSet[
                                        `overdue_${triggerNumber}_restrict`
                                    ] === "1"
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
                <legend v-if="ruleSetInfo.triggerCount < triggerNumber">
                    {{ $__("Notice for trigger") }}
                    {{ " " + triggerNumber }}
                </legend>
                <legend v-else>
                    {{ $__("Edit notice for trigger") }}
                    {{ " " + triggerNumber }}
                </legend>
                <ol>
                    <li>
                        <label for="letter_code">{{ $__("Letter") }}:</label>
                        <v-select
                            id="letter_code"
                            v-model="ruleSet[`overdue_${triggerNumber}_notice`]"
                            label="name"
                            :reduce="type => type.code"
                            :options="filteredLetters"
                            @change="isReadyForSubmission"
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    @change="isReadyForSubmission"
                                    class="vs__search"
                                    v-bind="attributes"
                                    v-on="events"
                                    :placeholder="
                                        ruleSet[
                                            `overdue_${triggerNumber}_notice`
                                        ] === null ||
                                        ruleSet[
                                            `overdue_${triggerNumber}_notice`
                                        ] === undefined
                                            ? letters.find(
                                                  letter =>
                                                      letter.code ===
                                                      fallbackRuleSet[
                                                          `overdue_${triggerNumber}_notice`
                                                      ]
                                              )?.name ||
                                              fallbackRuleSet[
                                                  `overdue_${triggerNumber}_notice`
                                              ]
                                            : ''
                                    "
                                />
                            </template>
                        </v-select>
                    </li>
                    <li
                        v-if="
                            ruleSet[`overdue_${triggerNumber}_notice`] !== '' ||
                            ((ruleSet[`overdue_${triggerNumber}_notice`] ===
                                null ||
                                ruleSet[`overdue_${triggerNumber}_notice`] ===
                                    undefined) &&
                                fallbackRuleSet[
                                    `overdue_${triggerNumber}_notice`
                                ] !== '')
                        "
                    >
                        <label for="mtt">{{ $__("Transport type(s)") }}:</label>
                        <v-select
                            id="mtt"
                            v-model="ruleSet[`overdue_${triggerNumber}_mtt`]"
                            label="name"
                            :reduce="type => type.code"
                            :options="transportTypes"
                            multiple
                        >
                            <template #search="{ attributes, events }">
                                <input
                                    @change="isReadyForSubmission"
                                    class="vs__search"
                                    v-bind="attributes"
                                    v-on="events"
                                    :placeholder="
                                        ruleSet[
                                            `overdue_${triggerNumber}_mtt`
                                        ] === null ||
                                        ruleSet[
                                            `overdue_${triggerNumber}_mtt`
                                        ] === undefined ||
                                        ruleSet[`overdue_${triggerNumber}_mtt`]
                                            .length === 0
                                            ? fallbackRuleSet[
                                                  `overdue_${triggerNumber}_mtt`
                                              ]
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
            getRawSelectedRuleSet,
            setEffectiveTriggerFilteredRuleSet,
        } = circRulesStore;
        const {
            letters,
            libraries,
            itemTypes,
            transportTypes,
            patronCategories,
            regex,
            triggerCount,
        } = storeToRefs(circRulesStore);

        return {
            letters,
            itemTypes,
            libraries,
            transportTypes,
            regex,
            triggerCount,
            patronCategories,
            getLibraries,
            getPatronCategories,
            getItemTypes,
            getRawSelectedRuleSet,
            updateTriggerCount,
            filterCircRulesByContext,
            findEffectiveRule,
            setEffectiveTriggerFilteredRuleSet,
        };
    },
    data() {
        return {
            initialized: false,
            triggerNumber: 1,
            libraryId: "*",
            library_id: null,
            patron_category_id: null,
            item_type_id: null,
            fallbackRuleSet: null,
            ruleSetInfo: {
                issuelength: null,
                decreaseloanholds: null,
                fine: null,
                chargeperiod: null,
                lengthunit: null,
                triggerCount: null,
            },
            editMode: false,
            ruleSet: null,
            triggerBeingEdited: null,
            minDelay: 0,
            maxDelay: Infinity,
            filteredLetters: [],
            alertMessage: null,
            allowSubmission: false,
            effectiveTriggerFilteredRuleSets: [],
        };
    },
    beforeRouteEnter(to, from, next) {
        next(async vm => {
            const { query } = to;
            vm.setContext(query);
            vm.setEditMode();
            vm.setTriggerNumber(query.triggerNumber);
            if (vm.editMode === "edit") {
                vm.ruleSet = await vm.getRawSelectedRuleSet(
                    query.library_id,
                    query.patron_category_id,
                    query.item_type_id
                );
                vm.updateTriggerCount(vm.ruleSet);
            } else {
                vm.ruleSet = {
                    context: {
                        library_id: query.library_id ?? "*",
                        patron_category_id: query.patron_category_id ?? "*",
                        item_type_id: query.item_type_id ?? "*",
                    },
                    [`overdue_${vm.triggerNumber}_delay`]: null,
                    [`overdue_${vm.triggerNumber}_notice`]: null,
                    [`overdue_${vm.triggerNumber}_mtt`]: null,
                    [`overdue_${vm.triggerNumber}_restrict`]: null,
                };
            }
            vm.setRuleSetInfo();
            vm.effectiveTriggerFilteredRuleSets =
                vm.setEffectiveTriggerFilteredRuleSet(vm.ruleSet);
            vm.setFallbackRuleSet();
            vm.setMinDelay();
            vm.setMaxDelay();
            vm.setFilteredLetters();
            vm.isReadyForSubmission();
            vm.initialized = true;
        });
    },
    methods: {
        async addCircRule(e) {
            e.preventDefault();

            const context = {
                library_id: this.ruleSet.context.library_id || "*",
                item_type_id: this.ruleSet.context.item_type_id || "*",
                patron_category_id:
                    this.ruleSet.context.patron_category_id || "*",
            };

            // this.checkForExistingRules will reset this.ruleSet - prevent this from affecting submission
            const ruleSetToSubmit = cloneDeep({context: {...this.ruleSet.context}});
            ruleSetToSubmit[`overdue_${this.triggerNumber}_delay`] =
                cloneDeep(this.ruleSet[`overdue_${this.triggerNumber}_delay`]);
            ruleSetToSubmit[`overdue_${this.triggerNumber}_notice`] =
                cloneDeep(this.ruleSet[`overdue_${this.triggerNumber}_notice`]);
            ruleSetToSubmit[`overdue_${this.triggerNumber}_restrict`] =
                cloneDeep(this.ruleSet[`overdue_${this.triggerNumber}_restrict`]);
            ruleSetToSubmit[`overdue_${this.triggerNumber}_mtt`] = cloneDeep(this.ruleSet?.[
                `overdue_${this.triggerNumber}_mtt`
            ].length
                ? this.ruleSet[`overdue_${this.triggerNumber}_mtt`].join(",")
                : null);
            ruleSetToSubmit[`overdue_${this.triggerNumber}_has_rules`] = true;

            // prevent race condition related edit conflicts
            if (this.editMode === "edit") {
                // store the ruleSet as loaded initially
                const oldCircRule = cloneDeep(this.ruleSet);

                // refresh this.ruleSet so it matches the database
                this.ruleSet = await this.getRawSelectedRuleSet(
                    this.ruleSet.context.library_id,
                    this.ruleSet.context.patron_category_id,
                    this.ruleSet.context.item_type_id
                );

                // if any changes are detected, inform the user, display the new values and go back to editing
                if (!isEqual(oldCircRule, this.ruleSet)) {
                    // refresh form
                    this.handleContextChange();
                    // prepare the alert message
                    this.alertMessage =
                        "Your changes could not be saved as this circulation trigger was updated elsewhere. Please see the updated trigger below.";
                    // reload the form components that have changed, remain in edit mode
                    this.$router.push({
                        path: "/cgi-bin/koha/admin/circulation_triggers/edit",
                        query: {
                            ...context,
                            triggerNumber: this.triggerNumber,
                        },
                    });
                    return;
                }
            }

            this.updateCircRuleSets(ruleSetToSubmit)

            await this.$router.replace({
                name: "CirculationTriggersList",
                query: { trigger: this.triggerNumber },
            });
            this.$router.go(0);
        },
        async handleContextChange() {
            if (this.editMode === "edit") {
                this.ruleSet = await this.getRawSelectedRuleSet(
                    query.library_id,
                    query.patron_category_id,
                    query.item_type_id
                );
                this.updateTriggerCount(this.ruleSet);
            } else {
                this.ruleSet = {
                    context: {
                        library_id: query.library_id ?? "*",
                        patron_category_id: query.patron_category_id ?? "*",
                        item_type_id: query.item_type_id ?? "*",
                    },
                    [`overdue_${this.triggerNumber}_delay`]: null,
                    [`overdue_${this.triggerNumber}_notice`]: null,
                    [`overdue_${this.triggerNumber}_mtt`]: null,
                    [`overdue_${this.triggerNumber}_restrict`]: null,
                };
            }
            this.setRuleSetInfo();
            this.effectiveTriggerFilteredRuleSets =
                this.setEffectiveTriggerFilteredRuleSet(this.ruleSet);
            this.setFallbackRuleSet();
        },
        setContext(query) {
            this.libraryId = query.libraryId ?? "*";
            this.patronCategoryId = query.patron_category_id ?? null;
            this.itemTypeId = query.item_type_id ?? null;
        },
        setEditMode() {
            this.editMode = this.$route.path.substring(
                this.$route.path.lastIndexOf("/") + 1
            );
        },
        setRuleSetInfo() {
            this.ruleSetInfo = {
                issuelength: this.ruleSet.issuelength,
                decreaseloanholds: this.ruleSet.decreaseloanholds,
                fine: this.ruleSet.fine,
                chargeperiod:this.ruleSet.chargeperiod,
                lengthunit:this.ruleSet.lengthunit,
                triggerCount: this.triggerCount,
            };
        },
        // assign the triggerNumber passed to the route or generate a new trigger number
        setTriggerNumber(triggerNumber) {
            this.triggerNumber =
                this.editMode === "edit"
                    ? triggerNumber
                    : this.triggerCount + 1;
        },
        // TODO: move into store, refactor - and check need for this also
        setFallbackRuleSet(ruleSets, context = null) {
            this.fallbackRuleSet = {
                [`overdue_${this.triggerNumber}_delay`]: this.findEffectiveRule(
                    this.ruleSet,
                    "delay",
                    i
                ).value,
                [`overdue_${this.triggerNumber}_notice`]:
                    this.findEffectiveRule(this.ruleSet, "notice", i).value,
                [`overdue_${this.triggerNumber}_mtt`]: this.findEffectiveRule(
                    this.ruleSet,
                    "mtt",
                    i
                ).value,
                [`overdue_${this.triggerNumber}_restrict`]:
                    this.findEffectiveRule(this.ruleSet, "restrict", i).value,
            };
        },
        setMinDelay() {
            if (this.triggerNumber === 0 || this.triggerNumber === 1) {
                this.minDelay = 0;
                return;
            }
            const priorTriggerNumber = this.triggerNumber - 1;
            this.minDelay = this.ruleSet[`overdue_${priorTriggerNumber}_delay`]
                ? parseInt(
                      this.ruleSet[`overdue_${priorTriggerNumber}_delay`]
                  ) + 1
                : 0;
        },
        setMaxDelay() {
            const nextTriggerNumber = this.triggerNumber + 1;
            this.maxDelay = this.ruleSet?.[`overdue_${nextTriggerNumber}_delay`]
                ? parseInt(this.ruleSet[`overdue_${nextTriggerNumber}_delay`]) -
                  1
                : Infinity;
        },
        setFilteredLetters() {
            let library = this.ruleSet.context.library_id;
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
                this.ruleSet[`overdue_${this.triggerNumber}_delay`] ===
                    undefined ||
                this.ruleSet[`overdue_${this.triggerNumber}_delay`] === null
            ) {
                this.ruleSet[`overdue_${this.triggerNumber}_delay`] = min;
            }

            // Increment within the valid range
            else {
                this.ruleSet["delay"] = Math.min(
                    this.ruleSet[`overdue_${this.triggerNumber}_delay`] + 1,
                    max
                );
            }
            this.isReadyForSubmission();
        },
        decrementDelay() {
            // Check for minDelay
            const min = this.minDelay !== undefined ? this.minDelay : 1;

            // Decrement only if greater than minDelay
            if (this.ruleSet[`overdue_${this.triggerNumber}_delay`] > min) {
                this.ruleSet[`overdue_${this.triggerNumber}_delay`]--;
            }
            this.isReadyForSubmission();
        },
        isReadyForSubmission() {
            this.allowSubmission =
                this.ruleSet[`overdue_${this.triggerNumber}_delay`] !== null ||
                this.ruleSet[`overdue_${this.triggerNumber}_notice`] !== null ||
                this.ruleSet[`overdue_${this.triggerNumber}_mtt`]?.length !==
                    0 ||
                this.ruleSet[`overdue_${this.triggerNumber}_restrict`] !== null;
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
.modal-header {
    display: flex;
    justify-content: space-between;
}
</style>
