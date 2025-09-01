<template>
    <Toolbar>
        <ToolbarButton
            :to="{
                name: 'CirculationTriggersFormConfirmContext',
                query: {
                    library_id: selectedLibrary,
                    patron_category_id: selectedCategory,
                    item_type_id: selectedItemType,
                },
            }"
            icon="plus"
            :title="$__('Add new trigger')"
        />
    </Toolbar>
    <div v-if="initialized">
        <h1>{{ $__("Circulation triggers") }}</h1>
        <div class="page-section bg-info">
            <p>
                {{
                    $__(
                        "Rules are applied from most specific to less specific, using the first found in this order"
                    )
                }}:
            </p>
            <ul>
                <li>
                    {{
                        $__(
                            "same library, same patron category, same item type"
                        )
                    }}
                </li>
                <li>
                    {{
                        $__(
                            "same library, same patron category, all item types"
                        )
                    }}
                </li>
                <li>
                    {{
                        $__(
                            "same library, all patron categories, same item type"
                        )
                    }}
                </li>
                <li>
                    {{
                        $__(
                            "same library, all patron categories, all item types"
                        )
                    }}
                </li>
                <li>
                    {{
                        $__(
                            "default (all libraries), same patron category, same item type"
                        )
                    }}
                </li>
                <li>
                    {{
                        $__(
                            "default (all libraries), same patron category, all item types"
                        )
                    }}
                </li>
                <li>
                    {{
                        $__(
                            "default (all libraries), all patron categories, same item type"
                        )
                    }}
                </li>
                <li>
                    {{
                        $__(
                            "default (all libraries), all patron categories, all item types"
                        )
                    }}
                </li>
            </ul>
            <p>
                {{
                    $__(
                        "The system is currently set to match based on the %s"
                    ).format(from_branch)
                }}
            </p>
            <p>
                {{
                    $__(
                        "NOTE: Delay for a given trigger can be pushed forward or backwards only within the bounds of what its two neighbouring triggers allows."
                    )
                }}
            </p>
        </div>
        <div class="page-section" v-if="initialized">
            <legend>
                Filter by
                <span style="color: blue; font-weight: bold">context</span>
            </legend>
            <table>
                <thead>
                    <tr>
                        <th>{{ $__("Library") }}</th>
                        <th>{{ $__("Category") }}</th>
                        <th>{{ $__("Item type") }}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <v-select
                                id="library_select"
                                v-model="selectedLibrary"
                                label="name"
                                :reduce="lib => lib.library_id"
                                :options="libraries"
                                @update:modelValue="
                                    filterRuleSetsbySearchParam(params)
                                "
                                placeholder="Default rules for all libraries"
                            >
                                <template #search="{ attributes, events }">
                                    <input
                                        :required="!selectedLibrary"
                                        class="vs__search"
                                        v-bind="attributes"
                                        v-on="events"
                                    />
                                </template>
                            </v-select>
                        </td>
                        <td>
                            <v-select
                                id="patron_category_select"
                                v-model="selectedCategory"
                                label="name"
                                :reduce="cat => cat.patron_category_id"
                                :options="patronCategories"
                                @update:modelValue="
                                    filterRuleSetsbySearchParam(params)
                                "
                                placeholder="any"
                            >
                                <template #search="{ attributes, events }">
                                    <input
                                        :required="!selectedCategory"
                                        class="vs__search"
                                        v-bind="attributes"
                                        v-on="events"
                                    />
                                </template>
                            </v-select>
                        </td>
                        <td>
                            <v-select
                                id="item_type_select"
                                v-model="selectedItemType"
                                label="description"
                                :reduce="itype => itype.item_type_id"
                                :options="itemTypes"
                                @update:modelValue="
                                    filterRuleSetsbySearchParam(params)
                                "
                                placeholder="any"
                            >
                                <template #search="{ attributes, events }">
                                    <input
                                        :required="!selectedItemType"
                                        class="vs__search"
                                        v-bind="attributes"
                                        v-on="events"
                                    />
                                </template>
                            </v-select>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div class="toggle-view-all-applicable-wrapper">
                <label for="filter-rules">{{ $__("Display ") }}</label>
                <v-select
                    id="filter-rules"
                    v-model="displayAllApplicableRules"
                    :reduce="opt => opt.value"
                    :options="[
                        {
                            value: 0,
                            label: 'explictly set rules.',
                        },
                        {
                            value: 1,
                            label: 'all applied rules.',
                        },
                    ]"
                    @update:modelValue="filterRuleSetsbySearchParam(params)"
                >
                </v-select>
            </div>
        </div>
    </div>
    <div v-if="initialized">
        <div id="circ_triggers_tabs" class="toptabs numbered">
            <ul class="nav nav-tabs" role="tablist">
                <li
                    v-for="(number, i) in numberOfTabs"
                    class="nav-item"
                    role="presentation"
                    :key="`noticeTab${i}`"
                >
                    <a
                        href="#"
                        class="nav-link"
                        role="tab"
                        v-bind:class="
                            tabSelected === `Notice ${number}` ? 'active' : ''
                        "
                        @click="changeTabContent"
                        :data-content="`Notice ${number}`"
                        >{{ $__("Trigger") + " " + number }}</a
                    >
                </li>
            </ul>
        </div>
        <div class="tab-content">
            <template v-for="(number, i) in numberOfTabs">
                <div
                    class="tab-pane"
                    role="tabpanel"
                    v-bind:class="
                        tabSelected === `Notice ${number}` ? 'show active' : ''
                    "
                    v-if="tabSelected === `Notice ${number}`"
                    :key="`noticeTabContent${i}`"
                >
                    <TriggersTable
                        :modal="false"
                        :ruleSets="ruleSets"
                        :triggerNumber="number"
                    />
                </div>
            </template>
        </div>
    </div>
    <div v-if="showModal" class="modal" role="dialog">
        <div
            class="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable"
            role="document"
        >
            <router-view></router-view>
        </div>
    </div>
</template>

<script>
import Toolbar from "../../Toolbar.vue";
import ToolbarButton from "../../ToolbarButton.vue";
import TriggersTable from "./TriggersTable.vue";
import { inject } from "vue";
import { storeToRefs } from "pinia";

export default {
    setup() {
        const circRulesStore = inject("circRulesStore");
        const {
            splitCircRulesByTriggerNumber,
            getLibraries,
            getPatronCategories,
            getItemTypes,
            updateTriggerCount,
            setAllRawRuleSets,
            setAllExhaustiveEffectiveRuleSets,
        } = circRulesStore;
        const {
            itemTypes,
            letters,
            libraries,
            patronCategories,
            regex,
            triggerCount,
            allExhaustiveEffectiveRuleSets,
        } = storeToRefs(circRulesStore);

        return {
            splitCircRulesByTriggerNumber,
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
            allExhaustiveEffectiveRuleSets,
            setAllRawRuleSets,
            setAllExhaustiveEffectiveRuleSets,
            from_branch,
        };
    },
    data() {
        return {
            initialized: false,
            selectedLibrary: null,
            selectedCategory: null,
            selectedItemType: null,
            circRuleSets: null,
            numberOfTabs: [1],
            tabSelected: "Notice 1",
            showModal: false,
            displayAllApplicableRules: 1,
            allCircRuleSets: [],
        };
    },
    beforeRouteEnter(to, from, next) {
        next(vm => {
            vm.getLibraries().then(() =>
                vm.getPatronCategories().then(() =>
                    vm.getItemTypes().then(() =>
                        vm.setAllRawRuleSets().then(() => {
                            vm.updateTriggerCount();
                            vm.setAllExhaustiveEffectiveRuleSets();
                            vm.filterRuleSetsbySearchParam();
                            vm.initialized = true;
                        })
                    )
                )
            );
        });
    },
    methods: {
        filterRuleSetsbySearchParam() {
            const selectedParams = {};
            selectedParams.effective = true;
            if (this.selectedLibrary) {
                selectedParams.library_id = this.selectedLibrary;
            } else {
                selectedParams.library_id = "*";
            }

            if (this.selectedCategory) {
                selectedParams.patron_category_id = this.selectedCategory;
            }
            if (this.selectedItemType) {
                selectedParams.item_type_id = this.selectedItemType;
            }

            // get the number of triggers
            this.updateTriggerCount();
            // handle searches for any patron category and item type combinations
            if (
                !selectedParams.patron_category_id &&
                !selectedParams.item_type_id
            ) {
                this.ruleSets = this.allExhaustiveEffectiveRuleSets;
                return;
            }

            // handle searches where only the item type is specified
            if (!selectedParams.patron_category_id) {
                this.ruleSets = this.allExhaustiveEffectiveRuleSets.filter(
                    ruleSet =>
                        ruleSet.context.item_type_id === context.item_type_id &&
                        ruleSet.context.library_id === context.library_id
                );
                return;
            }

            // handle searches where only the patron category is specified
            if (!selectedParams.item_type_id) {
                this.ruleSets = this.allExhaustiveEffectiveRuleSets.filter(
                    ruleSet =>
                        ruleSet.context.patron_category_id ===
                            context.patron_category_id &&
                        ruleSet.context.library_id === context.library_id
                );
                return;
            }

            // handle searches where both patron category and item type are specified and one specific rule is retrieved
            this.ruleSets = this.allExhaustiveEffectiveRuleSets.filter(
                ruleSet =>
                    ruleSet.context.item_type_id === context.item_type_id &&
                    ruleSet.context.patron_category_id ===
                        context.patron_category_id &&
                    ruleSet.context.library_id === context.library_id
            );
            return;
        },
        changeTabContent(e) {
            this.tabSelected = e.target.getAttribute("data-content");
        },
    },
    watch: {
        $route: {
            immediate: true,
            handler: function (newVal, oldVal) {
                this.showModal = newVal.meta && newVal.meta.showModal;
            },
        },
    },
    components: { TriggersTable, Toolbar, ToolbarButton },
};
</script>

<style scoped>
.page-section table {
    width: 100%;
    table-layout: fixed;
}
.page-section th,
.page-section td {
    width: 33%;
}
.page-section td {
    padding: 0.5em;
    vertical-align: top;
}
.v-select {
    display: block;
    background-color: white;
    margin: 10px;
    height: auto;
}
.vs__search,
.v__selected {
    display: inline-block;
    vertical-align: middle;
}
.active {
    cursor: pointer;
}
.toptabs {
    margin-bottom: 0;
}
.toggle-view-all-applicable-wrapper {
    margin: 10px;
}

.modal {
    position: fixed;
    z-index: 9998;
    display: table;
    transition: opacity 0.3s ease;
    left: 0px;
    top: 0px;
    width: 100%;
    height: 100%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.33);
    background-color: rgba(0, 0, 0, 0.33);
}
.modal-dialog,
.modal-dialog-centered,
.modal-lg {
    max-width: 90%;
    width: fit-content;
}
</style>
