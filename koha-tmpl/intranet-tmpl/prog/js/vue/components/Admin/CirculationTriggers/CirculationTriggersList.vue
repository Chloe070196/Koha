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
                                @update:modelValue="getCircRules()"
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
                            label: 'explictly set rules.',
                        },
                        {
                            value: 1,
                            label: 'all applied rules.',
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
                        :contextSpecificCircRules="contextSpecificCircRules"
                        :allCircRulesForTrigger="this.allCircRulesForTrigger"
                        :triggerNumber="number"
                        :categories="patronCategories"
                        :itemTypes="itemTypes"
                        :libraries="libraries"
                        :letters="letters"
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
            displayAllApplicableRules: 1,
            allCircRules: [],
        };
    },
    beforeRouteEnter(to, from, next) {
        next(vm => {
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

            let rules;
            try {
                rules = await client.circRules.getAll({}, selectedParams);
                this.allCircRules = await client.circRules.getAll(
                    {},
                    { effective: false }
                );
            } catch (e) {
                throw e;
            }

            let ruleList = [];

            if (this.displayAllApplicableRules && this.allCircRules) {
                ruleList =
                    this.generateExhaustiveRuleListForSearchParams(
                        selectedParams
                    );
            }
            const { numberOfTabs, rulesPerTrigger: circRules } =
                this.splitCircRulesByTriggerNumber(
                    this.displayAllApplicableRules ? ruleList : rules
                );
            const {
                numberOfTabsForAllRules,
                rulesPerTrigger: allCircRulesForTrigger,
            } = this.splitCircRulesByTriggerNumber(this.allCircRules);
            this.numberOfTabs = numberOfTabs;
            // this is used to determine what rules do exist for a given context specifically
            this.contextSpecificCircRules = circRules;
            // this is used to generate defaults across contexts when needed and no matter the specificity of the search
            this.allCircRulesForTrigger = allCircRulesForTrigger;
        },
        // generate an exhaustive list of the rule sets that will apply to each possible context parameter combination
        // MUST BE TRIGGER SPECIFIC
        generateContextAndTriggerSpecificRuleSet(
            categoryId,
            itemTypeId,
            libraryId = "*",
            triggerNumber
        ) {
            // find context specific rule set OR
            const matchingItemTypeAndPatronCategoryAndLibraryRuleSet =
                cloneDeep(
                    this.allCircRules.find(
                        ruleSet =>
                            ruleSet.context.item_type_id === itemTypeId &&
                            ruleSet.context.patron_category_id === categoryId &&
                            ruleSet.context.library_id === libraryId &&
                            (ruleSet[`overdue_${triggerNumber}_delay`] !==
                                null ||
                                ruleSet[`overdue_${triggerNumber}_notice`] !==
                                    null ||
                                ruleSet[`overdue_${triggerNumber}_mtt`] !==
                                    null ||
                                ruleSet[`overdue_${triggerNumber}_restrict`] !==
                                    null)
                    )
                );
            if (matchingItemTypeAndPatronCategoryAndLibraryRuleSet) {
                return matchingItemTypeAndPatronCategoryAndLibraryRuleSet;
            }

            // find patron category specific rule set (default for all item types) OR
            const matchingPatronCategoryAndLibraryRuleSet = cloneDeep(
                this.allCircRules.find(
                    ruleSet =>
                        ruleSet.context.patron_category_id === categoryId &&
                        ruleSet.context.item_type_id === "*" &&
                        ruleSet.context.library_id === libraryId &&
                        (ruleSet[`overdue_${triggerNumber}_delay`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_notice`] !==
                                null ||
                            ruleSet[`overdue_${triggerNumber}_mtt`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_restrict`] !==
                                null)
                )
            );
            if (matchingPatronCategoryAndLibraryRuleSet) {
                matchingPatronCategoryAndLibraryRuleSet.context.item_type_id =
                    itemTypeId;
                matchingPatronCategoryAndLibraryRuleSet.context.library_id =
                    libraryId;
                matchingPatronCategoryAndLibraryRuleSet[
                    `overdue_${triggerNumber}_ruleset_exists_in_db`
                ] = false;
                return matchingPatronCategoryAndLibraryRuleSet;
            }

            // find item type specific rule set (default for all patron categories) OR
            const matchingItemTypeAndLibraryRuleSet = cloneDeep(
                this.allCircRules.find(
                    ruleSet =>
                        ruleSet.context.item_type_id === itemTypeId &&
                        ruleSet.context.patron_category_id === "*" &&
                        ruleSet.context.library_id === libraryId &&
                        (ruleSet[`overdue_${triggerNumber}_delay`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_notice`] !==
                                null ||
                            ruleSet[`overdue_${triggerNumber}_mtt`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_restrict`] !==
                                null)
                )
            );
            if (matchingItemTypeAndLibraryRuleSet) {
                matchingItemTypeAndLibraryRuleSet.context.patron_category_id =
                    categoryId;
                matchingItemTypeAndLibraryRuleSet.context.library_id =
                    libraryId;
                matchingItemTypeAndLibraryRuleSet[
                    `overdue_${triggerNumber}_ruleset_exists_in_db`
                ] = false;
                return matchingItemTypeAndLibraryRuleSet;
            }

            // find library specific rule set (default for all patron categories and item types) OR
            const matchingLibraryRuleSet = cloneDeep(
                this.allCircRules.find(
                    ruleSet =>
                        ruleSet.context.item_type_id === "*" &&
                        ruleSet.context.patron_category_id === "*" &&
                        ruleSet.context.library_id === libraryId &&
                        (ruleSet[`overdue_${triggerNumber}_delay`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_notice`] !==
                                null ||
                            ruleSet[`overdue_${triggerNumber}_mtt`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_restrict`] !==
                                null)
                )
            );
            if (matchingLibraryRuleSet) {
                matchingLibraryRuleSet.context.patron_category_id = categoryId;
                matchingLibraryRuleSet.context.item_type_id = itemTypeId;
                matchingLibraryRuleSet.context.library_id = libraryId;
                matchingLibraryRuleSet[
                    `overdue_${triggerNumber}_ruleset_exists_in_db`
                ] = false;
                return matchingLibraryRuleSet;
            }

            // find context specific rule set default for all libraries OR
            const matchingItemTypeAndPatronCategoryRuleSet = cloneDeep(
                this.allCircRules.find(
                    ruleSet =>
                        ruleSet.context.item_type_id === itemTypeId &&
                        ruleSet.context.patron_category_id === categoryId &&
                        ruleSet.context.library_id === "*" &&
                        (ruleSet[`overdue_${triggerNumber}_delay`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_notice`] !==
                                null ||
                            ruleSet[`overdue_${triggerNumber}_mtt`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_restrict`] !==
                                null)
                )
            );

            if (matchingItemTypeAndPatronCategoryRuleSet) {
                matchingItemTypeAndPatronCategoryRuleSet.context.library_id =
                    libraryId;
                matchingItemTypeAndPatronCategoryRuleSet[
                    `overdue_${triggerNumber}_ruleset_exists_in_db`
                ] = false;
                return matchingItemTypeAndPatronCategoryRuleSet;
            }

            // find patron category specific rule set (default for all item types) OR
            const matchingPatronCategoryRuleSet = cloneDeep(
                this.allCircRules.find(
                    ruleSet =>
                        ruleSet.context.patron_category_id === categoryId &&
                        ruleSet.context.item_type_id === "*" &&
                        ruleSet.context.library_id === "*" &&
                        (ruleSet[`overdue_${triggerNumber}_delay`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_notice`] !==
                                null ||
                            ruleSet[`overdue_${triggerNumber}_mtt`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_restrict`] !==
                                null)
                )
            );
            if (matchingPatronCategoryRuleSet) {
                matchingPatronCategoryRuleSet.context.item_type_id = itemTypeId;
                matchingPatronCategoryRuleSet.context.library_id = libraryId;
                matchingPatronCategoryRuleSet[
                    `overdue_${triggerNumber}_ruleset_exists_in_db`
                ] = false;
                return matchingPatronCategoryRuleSet;
            }

            // find item type specific rule set (default for all patron categories) OR
            const matchingItemTypeRuleSet = cloneDeep(
                this.allCircRules.find(
                    ruleSet =>
                        ruleSet.context.item_type_id === itemTypeId &&
                        ruleSet.context.patron_category_id === "*" &&
                        ruleSet.context.library_id === "*" &&
                        (ruleSet[`overdue_${triggerNumber}_delay`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_notice`] !==
                                null ||
                            ruleSet[`overdue_${triggerNumber}_mtt`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_restrict`] !==
                                null)
                )
            );
            if (matchingItemTypeRuleSet) {
                matchingItemTypeRuleSet.context.patron_category_id = categoryId;
                matchingItemTypeRuleSet.context.library_id = libraryId;
                matchingItemTypeRuleSet[
                    `overdue_${triggerNumber}_ruleset_exists_in_db`
                ] = false;
                return matchingItemTypeRuleSet;
            }

            // no context specific rule set found, find the default
            const ruleSetGeneratedFromDefault = cloneDeep(
                this.allCircRules.find(
                    ruleSet =>
                        ruleSet.context.item_type_id == "*" &&
                        ruleSet.context.patron_category_id == "*" &&
                        ruleSet.context.library_id === "*" &&
                        (ruleSet[`overdue_${triggerNumber}_delay`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_notice`] !==
                                null ||
                            ruleSet[`overdue_${triggerNumber}_mtt`] !== null ||
                            ruleSet[`overdue_${triggerNumber}_restrict`] !==
                                null)
                )
            );

            if (ruleSetGeneratedFromDefault) {
                ruleSetGeneratedFromDefault.context.patron_category_id =
                    categoryId;
                ruleSetGeneratedFromDefault.context.item_type_id = itemTypeId;
                ruleSetGeneratedFromDefault.context.library_id = libraryId;
                ruleSetGeneratedFromDefault[
                    `overdue_${triggerNumber}_ruleset_exists_in_db`
                ] = false;
                return ruleSetGeneratedFromDefault;
            }
            // no ruleSet exist for the specific trigger
            return null;
        },
        // handles searches for rules by context using 'all patron categories and item types'
        // MUST CREATE OR UPDATE
        generateExhaustiveRuleListForSearchParams(params) {
            // handle searches where no patron category or item type are specified
            const ruleSetList = [];

            // get the number of triggers
            const regex = /overdue_(\d+)_delay/g;
            const numberOfTriggers = Object.keys(this.allCircRules[0]).filter(
                key => regex.test(key)
            ).length;

            // handle searches for any patron category and item type combinations
            if (!params.patron_category_id && !params.item_type_id) {
                this.patronCategories.forEach(category => {
                    this.itemTypes.forEach(itemType => {
                        for (let i = 1; i <= numberOfTriggers; i++) {
                            const currentCategory = cloneDeep(category);
                            const currentItemType = cloneDeep(itemType);

                            const ruleSubSet =
                                this.generateContextAndTriggerSpecificRuleSet(
                                    currentCategory.patron_category_id,
                                    currentItemType.item_type_id,
                                    params.library_id,
                                    i
                                );

                            // no rule subset exist for this context/trigger combination, abort
                            if (ruleSubSet === null) {
                                continue;
                            }

                            const ruleSetIndex = ruleSetList.findIndex(
                                ruleSet =>
                                    ruleSet.context.item_type_id ===
                                        currentItemType.item_type_id &&
                                    ruleSet.context.patron_category_id ===
                                        currentCategory.patron_category_id &&
                                    ruleSet.context.library_id ===
                                        params.library_id
                            );

                            // there is not rule set for this context, create one
                            if (ruleSetIndex === -1) {
                                ruleSetList.push(ruleSubSet);
                                continue;
                            }

                            // there is a rule set for this context, update it
                            const updatedRuleSet = {
                                ...ruleSetList[ruleSetIndex],
                                [`overdue_${i}_delay`]:
                                    ruleSubSet[`overdue_${i}_delay`] ?? null,
                                [`overdue_${i}_notice`]:
                                    ruleSubSet[`overdue_${i}_notice`] ?? null,
                                [`overdue_${i}_mtt`]:
                                    ruleSubSet[`overdue_${i}_mtt`] ?? null,
                                [`overdue_${i}_restrict`]:
                                    ruleSubSet[`overdue_${i}_restrict`] ?? null,
                                [`overdue_${i}_ruleset_exists_in_db`]:
                                    ruleSubSet[
                                        `overdue_${i}_ruleset_exists_in_db`
                                    ] ?? null,
                            };
                            ruleSetList.splice(ruleSetIndex, 1, updatedRuleSet);
                        }
                    });
                });
                return ruleSetList;
            }

            // handle searches where only the item type is specified
            if (!params.patron_category_id) {
                this.patronCategories.forEach(category => {
                    for (let i = 1; i <= numberOfTriggers; i++) {
                        const currentCategory = cloneDeep(category);
                        const ruleSubSet =
                            this.generateContextAndTriggerSpecificRuleSet(
                                currentCategory.patron_category_id,
                                params.item_type_id,
                                params.library_id,
                                i
                            );

                        // no rule subset exist for this context/trigger combination, abort
                        if (ruleSubSet === null) {
                            continue;
                        }

                        const ruleSetIndex = ruleSetList.findIndex(
                            ruleSet =>
                                ruleSet.context.item_type_id ===
                                    params.item_type_id &&
                                ruleSet.context.patron_category_id ===
                                    currentCategory.patron_category_id &&
                                ruleSet.context.library_id === params.library_id
                        );

                        // there is not rule set for this context, create one
                        if (ruleSetIndex === -1) {
                            ruleSetList.push(ruleSubSet);
                            continue;
                        }

                        // there is a rule set for this context, update it
                        const updatedRuleSet = {
                            ...ruleSetList[ruleSetIndex],
                            [`overdue_${i}_delay`]:
                                ruleSubSet[`overdue_${i}_delay`] ?? null,
                            [`overdue_${i}_notice`]:
                                ruleSubSet[`overdue_${i}_notice`] ?? null,
                            [`overdue_${i}_mtt`]:
                                ruleSubSet[`overdue_${i}_mtt`] ?? null,
                            [`overdue_${i}_restrict`]:
                                ruleSubSet[`overdue_${i}_restrict`] ?? null,
                            [`overdue_${i}_ruleset_exists_in_db`]:
                                ruleSubSet[
                                    `overdue_${i}_ruleset_exists_in_db`
                                ] ?? null,
                        };
                        ruleSetList.splice(ruleSetIndex, 1, updatedRuleSet);
                    }
                });
                return ruleSetList;
            }

            // handle searches where only the patron category is specified
            if (!params.item_type_id) {
                this.itemTypes.forEach(itemType => {
                    for (let i = 1; i <= numberOfTriggers; i++) {
                        const currentItemType = cloneDeep(itemType);
                        const ruleSubSet =
                            this.generateContextAndTriggerSpecificRuleSet(
                                params.patron_category_id,
                                currentItemType.item_type_id,
                                params.library_id,
                                i
                            );

                        if (i === 1) {
                            ruleSetList.push(ruleSubSet);
                            continue;
                        }

                        const ruleSetIndex = ruleSetList.findIndex(
                            ruleSet =>
                                ruleSet.context.item_type_id ===
                                    currentItemType.item_type_id &&
                                ruleSet.context.patron_category_id ===
                                    params.patron_category_id &&
                                ruleSet.context.library_id === params.library_id
                        );

                        const updatedRuleSet = {
                            ...ruleSetList[ruleSetIndex],
                            [`overdue_${i}_delay`]:
                                ruleSubSet[`overdue_${i}_delay`] ?? null,
                            [`overdue_${i}_notice`]:
                                ruleSubSet[`overdue_${i}_notice`] ?? null,
                            [`overdue_${i}_mtt`]:
                                ruleSubSet[`overdue_${i}_mtt`] ?? null,
                            [`overdue_${i}_restrict`]:
                                ruleSubSet[`overdue_${i}_restrict`] ?? null,
                            [`overdue_${i}_ruleset_exists_in_db`]:
                                ruleSubSet[
                                    `overdue_${i}_ruleset_exists_in_db`
                                ] ?? null,
                        };
                        ruleSetList.splice(ruleSetIndex, 1, updatedRuleSet);
                    }
                });
                return ruleSetList;
            }

            // handle searches where both patron category and item type are specified and one specific rule is retrieved
            for (let i = 1; i <= numberOfTriggers; i++) {
                const ruleSubSet =
                    this.generateContextAndTriggerSpecificRuleSet(
                        params.patron_category_id,
                        params.item_type_id,
                        params.library_id,
                        i
                    );

                if (i === 1) {
                    ruleSetList.push(ruleSubSet);
                    continue;
                }

                const ruleSetIndex = ruleSetList.findIndex(
                    ruleSet =>
                        ruleSet.context.item_type_id === params.item_type_id &&
                        ruleSet.context.patron_category_id ===
                            params.patron_category_id &&
                        ruleSet.context.library_id === params.library_id
                );

                const updatedRuleSet = {
                    ...ruleSetList[ruleSetIndex],
                    [`overdue_${i}_delay`]:
                        ruleSubSet[`overdue_${i}_delay`] ?? null,
                    [`overdue_${i}_notice`]:
                        ruleSubSet[`overdue_${i}_notice`] ?? null,
                    [`overdue_${i}_mtt`]:
                        ruleSubSet[`overdue_${i}_mtt`] ?? null,
                    [`overdue_${i}_restrict`]:
                        ruleSubSet[`overdue_${i}_restrict`] ?? null,
                    [`overdue_${i}_ruleset_exists_in_db`]:
                        ruleSubSet[`overdue_${i}_ruleset_exists_in_db`] ?? null,
                };
                ruleSetList.splice(ruleSetIndex, 1, updatedRuleSet);
            }
            return ruleSetList;
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
