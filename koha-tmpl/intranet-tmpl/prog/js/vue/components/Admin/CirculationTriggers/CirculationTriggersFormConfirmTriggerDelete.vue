<template>
    <CirculationTriggersForm
        :submitAction="deleteTrigger"
        formTitle="Confirm circulation trigger deletion"
    >
        <fieldset class="rows">
            <div class="page-section bg-info">
                <p>
                    {{
                        $__(
                            "Deleting this trigger will delete rule sets below."
                        )
                    }}
                </p>
            </div>
            <legend>
                {{ $__(`Deleting trigger number ${triggerNumber} for`) }}
            </legend>
            <ol v-if="initialized">
                <li>
                    <p>
                        <strong>{{ $__("Library") }}:</strong>
                    </p>
                    <p id="library_id">
                        {{ handleContext(libraryId, libraries, "library_id") }}
                    </p>
                </li>
            </ol>
            <div v-else>
                <p>{{ $__("Loading library...") }}</p>
            </div>
        </fieldset>
        <fieldset class="rows">
            <TriggersTable
                :triggerNumber="triggerNumber"
                :modal="false"
                :actions="false"
                :ruleSets="formattedEffectiveRuleSets"
            />
        </fieldset>
        <fieldset class="rows" v-if="alertMessage">
            <div class="alert alert-info">{{ alertMessage }}</div>
        </fieldset>
    </CirculationTriggersForm>
</template>
<script>
import TriggersTable from "./TriggersTable.vue";
import TriggerContext from "./TriggerContext.vue";
import CirculationTriggersForm from "./CirculationTriggersForm.vue";
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
            setAllRawRuleSets,
            deleteRuleSet,
        } = circRulesStore;
        const {
            letters,
            libraries,
            itemTypes,
            patronCategories,
            allCurrentLibraryRawRuleSets,
            ruleSuffixes,
            currentLibraryId,
        } = storeToRefs(circRulesStore);
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
            allCurrentLibraryRawRuleSets,
            setAllRawRuleSets,
            ruleSuffixes,
            currentLibraryId,
            deleteRuleSet,
        };
    },
    data() {
        return {
            alertMessage: null,
            initialized: false,
            libraryId: "*",
            triggerNumber: null,
            formattedEffectiveRuleSets: [],
        };
    },
    beforeRouteEnter(to, from, next) {
        next(async vm => {
            await vm.setAllRawRuleSets();
            vm.setContext(to.query);
            vm.setFormattedEffectiveRuleSets();
            vm.initialized = true;
        });
    },
    // TODO: determine which methods will be needed, limit amount of code repetition, consider extracting to circRuleStore
    methods: {
        async deleteTrigger(e) {
            e.preventDefault();
            for (const ruleSet of this.allCurrentLibraryRawRuleSets) {
                try {
                    await this.deleteRuleSet(ruleSet, this.triggerNumber);
                } catch (e) {
                    this.alertMessage = e;
                    // reload the form components that have changed, remain in reset mode
                    this.$router.push({
                        path: "/cgi-bin/koha/admin/circulation_triggers/reset",
                        query: {
                            ...ruleSet.context,
                            triggerNumber: this.triggerNumber,
                        },
                    });
                }
            }
            await this.$router.push({
                name: "CirculationTriggersList",
            });
            this.$router.go(0);
        },
        setFormattedEffectiveRuleSets() {
            // clear array
            this.formattedEffectiveRuleSets = [];
            // generate complete rule set list
            this.allCurrentLibraryRawRuleSets.forEach(ruleSet => {
                const effectiveRuleSet = {
                    context: { ...ruleSet.context },
                };

                if (
                    ruleSet[`overdue_${this.triggerNumber}_has_rules`] === null
                ) {
                    return;
                }
                this.ruleSuffixes.forEach(ruleSuffix => {
                    effectiveRuleSet[
                        `overdue_${this.triggerNumber}_${ruleSuffix}`
                    ] = this.findEffectiveRule(
                        effectiveRuleSet,
                        ruleSuffix,
                        this.triggerNumber
                    );
                });
                this.formattedEffectiveRuleSets.push(effectiveRuleSet);
            });
        },
        setContext(query) {
            this.libraryId = query.library_id ?? "*";
            this.itemTypeId = query.item_type_id ?? "*";
            this.patronCategoryId = query.patron_category_id ?? "*";
            this.triggerNumber = query.triggerNumber;
        },
    },
    components: { TriggerContext, TriggersTable, CirculationTriggersForm },
};
</script>

<style scoped>
#circulation-trigger-form-confirm-trigger-delete {
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
