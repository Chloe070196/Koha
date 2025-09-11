<template>
    <form
        id="circulation-trigger-form-confirm-reset"
        @submit="resetCircRule($event)"
        class="modal-content"
    >
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
                        <p id="library_id">
                            {{
                                handleContext(
                                    libraryId,
                                    libraries,
                                    "library_id"
                                )
                            }}
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>{{ $__("Patron category") }}:</strong>
                        </p>
                        <p id="patron_category_id">
                            {{
                                handleContext(
                                    patronCategoryId,
                                    patronCategories,
                                    "patron_category_id"
                                )
                            }}
                        </p>
                    </li>
                    <li>
                        <p>
                            <strong>{{ $__("Item type") }}:</strong>
                        </p>
                        <p id="item_type_id">
                            {{
                                handleContext(
                                    itemTypeId,
                                    itemTypes,
                                    "item_type_id",
                                    "description"
                                )
                            }}
                        </p>
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
                            <td
                                v-if="
                                    effectiveRuleSet[
                                        `overdue_${triggerNumber}_has_rules`
                                    ]
                                "
                            >
                                <span
                                    :class="{
                                        fallback:
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_delay`
                                            ].isFallback,
                                    }"
                                >
                                    {{
                                        effectiveRuleSet[
                                            `overdue_${triggerNumber}_delay`
                                        ].value
                                    }}
                                </span>
                            </td>

                            <!--  Notice -->
                            <td
                                v-if="
                                    effectiveRuleSet[
                                        `overdue_${triggerNumber}_has_rules`
                                    ]
                                "
                            >
                                <span
                                    :class="{
                                        fallback:
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_notice`
                                            ].isFallback,
                                    }"
                                >
                                    {{
                                        handleNotice(
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_notice`
                                            ].value
                                        )
                                    }}
                                </span>
                            </td>
                            <!-- Email -->
                            <td
                                v-if="
                                    effectiveRuleSet[
                                        `overdue_${triggerNumber}_has_rules`
                                    ]
                                "
                            >
                                <span
                                    :class="{
                                        fallback:
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_mtt`
                                            ].isFallback,
                                    }"
                                >
                                    {{
                                        handleTransport(
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_mtt`
                                            ].value,
                                            "email"
                                        )
                                    }}
                                </span>
                            </td>
                            <!-- Print -->
                            <td
                                v-if="
                                    effectiveRuleSet[
                                        `overdue_${triggerNumber}_has_rules`
                                    ]
                                "
                            >
                                <span
                                    :class="{
                                        fallback:
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_mtt`
                                            ].isFallback,
                                    }"
                                >
                                    {{
                                        handleTransport(
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_mtt`
                                            ].value,
                                            "print"
                                        )
                                    }}
                                </span>
                            </td>
                            <!-- SMS -->
                            <td
                                v-if="
                                    effectiveRuleSet[
                                        `overdue_${triggerNumber}_has_rules`
                                    ]
                                "
                            >
                                <span
                                    :class="{
                                        fallback:
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_mtt`
                                            ].isFallback,
                                    }"
                                >
                                    {{
                                        handleTransport(
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_mtt`
                                            ].value,
                                            "sms"
                                        )
                                    }}
                                </span>
                            </td>
                            <!-- Restricts Checkouts -->
                            <td
                                v-if="
                                    effectiveRuleSet[
                                        `overdue_${triggerNumber}_has_rules`
                                    ]
                                "
                            >
                                <span
                                    :class="{
                                        fallback:
                                            effectiveRuleSet[
                                                `overdue_${triggerNumber}_restrict`
                                            ].isFallback,
                                    }"
                                >
                                    {{
                                        effectiveRuleSet[
                                            `overdue_${triggerNumber}_restrict`
                                        ].value
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
</template>

<script>
import ButtonSubmit from "../../ButtonSubmit.vue";
import TriggerContext from "./TriggerContext.vue";
import { inject } from "vue";
import { storeToRefs } from "pinia";

export default {
    setup() {
        const circRulesStore = inject("circRulesStore");
        const {
            handleContext,
            handleNotice,
            handleRestrictions,
            handleTransport,
            findEffectiveRule,
            getRawSelectedRuleSet,
            updateCircRuleSets,
            hasConflict,
            formatTriggerSpecificRuleSetForDisplay,
        } = circRulesStore;
        const { letters, libraries, itemTypes, patronCategories } =
            storeToRefs(circRulesStore);
        return {
            letters,
            libraries,
            itemTypes,
            patronCategories,
            handleContext,
            findEffectiveRule,
            handleNotice,
            handleRestrictions,
            handleTransport,
            getRawSelectedRuleSet,
            updateCircRuleSets,
            hasConflict,
            formatTriggerSpecificRuleSetForDisplay,
        };
    },
    data() {
        return {
            alertMessage: null,
            initialized: false,
            libraryId: "*",
            itemTypeId: "*",
            patronCategoryId: "*",
            triggerNumber: null,
            ruleSet: null,
            currentRuleSet: null,
            fallbackRuleSet: null,
        };
    },
    beforeRouteEnter(to, from, next) {
        next(async vm => {
            vm.setContext(to.query);
            vm.ruleSet = await vm.getRawSelectedRuleSet(
                vm.libraryId,
                vm.patronCategoryId,
                vm.itemTypeId
            );
            vm.effectiveRuleSet = vm.formatTriggerSpecificRuleSetForDisplay(
                vm.ruleSet,
                vm.triggerNumber
            );
            vm.initialized = true;
        });
    },
    // TODO: determine which methods will be needed, limit amount of code repetition, consider extracting to circRuleStore
    methods: {
        async resetCircRule(e) {
            //TODO: convert this draft into functional code
            e.preventDefault();

            // prevent race condition related edit conflicts
            // if any changes are detected, inform the user, display the new values and go back to editing
            const ruleSetInDb = await this.getRawSelectedRuleSet(
                this.effectiveRuleSet.context.library_id,
                this.effectiveRuleSet.context.patron_category_id,
                this.effectiveRuleSet.context.item_type_id
            );

            if (
                this.hasConflict(
                    this.effectiveRuleSet,
                    ruleSetInDb,
                    this.triggerNumber
                )
            ) {
                this.alertMessage =
                    "The rule set for the selected trigger context could not be reset as it was updated elsewhere. Please see the updated trigger above.";
                // reload the form components that have changed, remain in edit mode
                this.$router.push({
                    path: "/cgi-bin/koha/admin/circulation_triggers/reset",
                    query: {
                        ...this.effectiveRuleSet.context,
                        triggerNumber: this.triggerNumber,
                    },
                });
                return;
            }

            const circRule = { context: this.effectiveRuleSet.context };

            if (
                this.effectiveRuleSet[`overdue_${this.triggerNumber}_delay`] !==
                null
            ) {
                circRule[`overdue_${this.triggerNumber}_delay`] = null;
            }
            if (
                this.effectiveRuleSet[
                    `overdue_${this.triggerNumber}_notice`
                ] !== null
            ) {
                circRule[`overdue_${this.triggerNumber}_notice`] = null;
            }
            if (
                this.effectiveRuleSet[
                    `overdue_${this.triggerNumber}_restrict`
                ] !== null
            ) {
                circRule[`overdue_${this.triggerNumber}_restrict`] = null;
            }
            if (
                this.effectiveRuleSet[`overdue_${this.triggerNumber}_mtt`] !==
                null
            ) {
                circRule[`overdue_${this.triggerNumber}_mtt`] = null;
            }
            circRule[`overdue_${this.triggerNumber}_has_rules`] = null;

            this.updateCircRuleSets();
            await this.$router.push({
                name: "CirculationTriggersList",
                query: { trigger: this.triggerNumber },
            });
            this.$router.go(0);
        },
        setContext(query) {
            this.libraryId = query.library_id ?? "*";
            this.itemTypeId = query.item_type_id ?? "*";
            this.patronCategoryId = query.patron_category_id ?? "*";
            this.triggerNumber = query.triggerNumber;
        },
    },
    components: { ButtonSubmit, TriggerContext },
};
</script>

<style scoped>
#circulation-trigger-form-confirm-reset {
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
