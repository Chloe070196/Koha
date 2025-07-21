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
                                @update:modelValue="getCircRules()"
                                placeholder="any"
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
                                @update:modelValue="getCircRules()"
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
                                @update:modelValue="getCircRules()"
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
                            label: 'defaults and overrides.',
                        },
                        {
                            value: 1,
                            label: 'all patron categories and items types.',
                        },
                    ]"
                    @update:modelValue="getCircRules()"
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
                        :circRules="circRules"
                        :triggerNumber="number"
                        :categories="patronCategories"
                        :itemTypes="itemTypes"
                        :libraries="libraries"
                        :letters="letters"
                        :lostValues="this.lostValues"
                    />
                </div>
            </template>
        </div>
    </div>
    <div v-if="showModal" class="modal" role="dialog">
        <div
            class="modal-dialog modal-dialog-centered modal-lg"
            role="document"
        >
            <router-view></router-view>
        </div>
    </div>
</template>

<script>
import Toolbar from "../../Toolbar.vue";
import ToolbarButton from "../../ToolbarButton.vue";
import { APIClient } from "../../../fetch/api-client.js";
import TriggersTable from "./TriggersTable.vue";
import { inject } from "vue";
import { storeToRefs } from "pinia";
import { cloneDeep } from "lodash";

export default {
    setup() {
        const circRulesStore = inject("circRulesStore");
        const { splitCircRulesByTriggerNumber } = circRulesStore;
        const { letters } = storeToRefs(circRulesStore);

        return {
            splitCircRulesByTriggerNumber,
            letters,
            from_branch,
        };
    },
    data() {
        return {
            initialized: false,
            libraries: null,
            selectedLibrary: default_view,
            selectedCategory: null,
            selectedItemType: null,
            circRules: null,
            numberOfTabs: [1],
            tabSelected: "Notice 1",
            showModal: false,
            lostValues: [],
            displayAllApplicableRules: 1,
        };
    },
    beforeRouteEnter(to, from, next) {
        next(vm => {
            vm.getLostValues().then(
                vm.getLibraries().then(() =>
                    vm.getCategories().then(() =>
                        vm.getItemTypes().then(() =>
                            vm.getCircRules({}, true).then(() => {
                                vm.tabSelected = to.query.trigger
                                    ? `Notice ${to.query.trigger}`
                                    : "Notice 1";
                                vm.initialized = true;
                            })
                        )
                    )
                )
            );
        });
    },
    methods: {
        async getLibraries() {
            const libClient = APIClient.library;
            await libClient.libraries.getAll().then(
                libraries => {
                    libraries.unshift({
                        library_id: "*",
                        name: "Default rules for all libraries",
                    });
                    this.libraries = libraries;
                },
                error => {}
            );
        },
        async getCategories() {
            const client = APIClient.patron;
            await client.patronCategories.getAll().then(
                patronCategories => {
                    patronCategories.unshift({
                        patron_category_id: "*",
                        name: "Default rule",
                    });
                    this.patronCategories = patronCategories;
                },
                error => {}
            );
        },
        async getItemTypes() {
            const client = APIClient.item;
            await client.itemTypes.getAll().then(
                types => {
                    types.unshift({
                        item_type_id: "*",
                        description: "Default rule",
                    });
                    this.itemTypes = types;
                },
                error => {}
            );
        },
        async getCircRules() {
            const client = APIClient.circRule;

            const selectedParams = {};
            selectedParams.effective = this.displayAllApplicableRules;
            if (this.selectedLibrary) {
                selectedParams.library_id = this.selectedLibrary;
            }
            if (this.selectedCategory) {
                selectedParams.patron_category_id = this.selectedCategory;
            }
            if (this.selectedItemType) {
                selectedParams.item_type_id = this.selectedItemType;
            }

            let rules;

            try {
                rules = await client.circRules.getAll({}, selectedParams);
            } catch (e) {
                throw e;
            }

            // generate a list of rule that is exhaustive (every single context combination listed)
            let ruleList = [];
            if (this.displayAllApplicableRules) {
                ruleList = await this.getExhaustiveRuleList(
                    rules,
                    selectedParams
                );
            }

            const { numberOfTabs, rulesPerTrigger: circRules } =
                this.splitCircRulesByTriggerNumber(
                    this.displayAllApplicableRules ? ruleList : rules
                );
            this.numberOfTabs = numberOfTabs;
            this.circRules = circRules;
        },
        // runs the generateExahustiveContextRuleList for the most specific context for which rules are found
        async getExhaustiveRuleList(rules, selectedParams) {
            const params = {
                library_id: selectedParams.library_id ?? "*",
                patron_category_id: selectedParams.patron_category_id ?? "*",
                item_type_id: selectedParams.item_type_id ?? "*",
            };

            if (rules.length !== 0) {
                return this.generateExahustiveContextRuleList(rules, params);
            }

            delete selectedParams.item_type_id;

            let defaultItemTypeRules;
            try {
                defaultItemTypeRules = await client.circRules.getAll(
                    {},
                    selectedParams
                );
            } catch (e) {
                throw e;
            }

            if (rules.length !== 0) {
                return this.generateExahustiveContextRuleList(
                    defaultItemTypeRules,
                    params
                );
            }

            delete selectedParams.patron_category_id;

            let defaultItemTypeAndPatronCategroyRules;
            try {
                defaultItemTypeAndPatronCategroyRules =
                    await client.circRules.getAll({}, selectedParams);
            } catch (e) {
                throw e;
            }

            return this.generateExahustiveContextRuleList(
                defaultItemTypeAndPatronCategroyRules,
                params
            );
        },
        // takes in a set of defaults and generate an exhaustive list of all contexts these may apply to, narrowed down by library
        // "placeholder" rules are only generated for contexts that no rule is found to match
        generateExahustiveContextRuleList(rules, params) {
            const ruleList = [];
            rules.forEach(rule => {
                const currentRule = cloneDeep(rule);
                if (
                    params.patron_category_id === "*" &&
                    params.item_type_id === "*"
                ) {
                    this.patronCategories.forEach(category => {
                        this.itemTypes.forEach(itemType => {
                            if (
                                !rules.find(
                                    rule =>
                                        rule.context.patron_category_id ===
                                        category.patron_category_id
                                ) &&
                                !rules.find(
                                    rule =>
                                        rule.context.item_type_id ===
                                        category.item_type_id
                                )
                            ) {
                                const ruleGeneratedFromDefault =
                                    cloneDeep(currentRule);
                                ruleGeneratedFromDefault.context.patron_category_id =
                                    category.patron_category_id;
                                ruleGeneratedFromDefault.context.item_type_id =
                                    itemType.item_type_id;
                                ruleList.push(ruleGeneratedFromDefault);
                            }
                        });
                    });
                } else if (params.patron_category_id === "*") {
                    this.patronCategories.forEach(category => {
                        if (
                            !rules.find(
                                rule =>
                                    rule.context.patron_category_id ===
                                    category.patron_category_id
                            )
                        ) {
                            const ruleGeneratedFromDefault =
                                cloneDeep(currentRule);
                            ruleGeneratedFromDefault.context.patron_category_id =
                                category.patron_category_id;
                            ruleList.push(ruleGeneratedFromDefault);
                        }
                    });
                } else if (params.item_type_id === "*") {
                    this.itemTypes.forEach(itemType => {
                        if (
                            !rules.find(
                                rule =>
                                    rule.context.item_type_id ===
                                    itemType.item_type_id
                            )
                        ) {
                            const ruleGeneratedFromDefault =
                                cloneDeep(currentRule);
                            ruleGeneratedFromDefault.context.item_type_id =
                                itemType.item_type_id;
                            ruleList.push(ruleGeneratedFromDefault);
                        }
                    });
                } else {
                    ruleList.push(currentRule);
                }
            });
            return ruleList;
        },
        async getLostValues() {
            const client = APIClient.authorised_values;
            await client.values.get("lost").then(lostValues => {
                this.lostValues = lostValues;
            });
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
    height: auto; /* Restore original height */
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
}
.modal-dialog {
    overflow: auto;
    height: 90%;
}
</style>
