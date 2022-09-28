import type { Router } from 'vue-router';

export const LEAF = Symbol('leaf-page');

export interface PageTreeType {
	[name: string]: PageTreeType | typeof LEAF;
}

export const PageTree: PageTreeType = {
	home: {
		load: LEAF,
		config: {
			'new-config': LEAF,
			'edit-config': LEAF,
		},
		settings: LEAF,
		database: LEAF,
		logs: LEAF,
	},
};

export function get_parent(name: string) {
	return find_parent(PageTree, name);
}

function find_parent(
	tree: PageTreeType | typeof LEAF,
	name: string
): string | undefined {
	if (tree === LEAF) {
		return undefined;
	}
	if (name in tree) {
		return name;
	}
	const subpages = Object.keys(tree);
	const result = subpages.reduce<string | undefined>((result, page) => {
		if (result !== undefined) return result;
		const subtree = tree[page];
		const test = find_parent(subtree, name);
		return test;
	}, undefined);
	return result;
}

function page_is_child(
	tree: PageTreeType | typeof LEAF,
	name: string
): boolean {
	if (tree === LEAF) {
		return false;
	}
	return name in tree;
}

export function back(router: Router) {
	const page = (router.currentRoute.value.name ?? 'home').toString();
	const parent = get_parent(page);
	if (parent !== undefined) {
		router.push({
			name: parent,
		});
	}
}
