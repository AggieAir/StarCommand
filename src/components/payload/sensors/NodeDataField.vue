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
	<div class="detail">
		<span class="label" :title="dataField.definition.description">
			{{ dataField.definition.name }}
		</span>
		<span class="value" :title="dataField.definition.description">
			{{ dataField.value }} {{ units }}
		</span>
	</div>
</template>

<style scoped lang="scss">
.detail {
	.label {
		text-align: left;

		&::after {
			content: ':';
		}
	}

	.value {
		text-align: right;
		flex-grow: 1;
	}
}
</style>
