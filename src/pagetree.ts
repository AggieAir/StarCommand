import type { Router } from "vue-router";

export const LEAF = Symbol("leaf-page");

export interface PageTreeType {
	[name: string]: PageTreeType | typeof LEAF;
}

export const PageTree: PageTreeType = {
	home: {
		load: LEAF,
		config: {
			"new-config": LEAF,
			"edit-config": LEAF,
		},
		settings: LEAF,
		database: LEAF,
		logs: LEAF,
		"device-config": LEAF,
	},
};

export function get_parent(name: string) {
	return find_parent(PageTree, "root", name);
}

function find_parent(
	tree: PageTreeType | typeof LEAF,
	tree_name: string,
	name: string
): string | undefined {
	if (tree === LEAF) {
		return undefined;
	}
	if (name in tree) {
		return tree_name;
	}
	const subpages = Object.keys(tree);
	const result = subpages.reduce<string | undefined>((result, page) => {
		if (result !== undefined) return result;
		const subtree = tree[page];
		const test = find_parent(subtree, page, name);
		return test;
	}, undefined);
	return result;
}

export function back(router: Router) {
	const page = (router.currentRoute.value.name ?? "home").toString();
	const parent = get_parent(page);
	if (parent !== undefined) {
		router.push({
			name: parent,
		});
	}
}
