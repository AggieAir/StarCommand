<script lang="ts">
import type { NodeDataField as DataField } from '@/datastructures/status/node_base';
import { defineComponent, type PropType } from 'vue';

export default defineComponent({
	props: {
		dataField: {
			type: Object as PropType<DataField>,
			required: true,
		},
	},
	computed: {
		units() {
			return this.dataField.definition.units?.replace(/deg /, '°') ?? '';
		},
	},
});
</script>

<template>
	<span class="label" :title="dataField.definition.description">
		{{ dataField.definition.name }}
	</span>
	<span class="value" :title="dataField.definition.description">
		{{ dataField.value }} {{ units }}
	</span>
</template>

<style scoped lang="scss">
.label {
	text-align: left;

	&::after {
		content: ':';
	}
}

.value {
	text-align: right;
	flex-shrink: 1;
}
</style>
