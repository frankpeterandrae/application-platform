/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Db } from '../db';

vi.mock('../db', () => ({
	withTx: vi.fn((_db: Db, fn: () => void) => fn())
}));

vi.mock('../programming/cv-definition-types', () => ({
	parseFolderConfig: vi.fn(),
	parseCvNumberConfig: vi.fn(),
	parseCvBooleanConfig: vi.fn(),
	parseCvSelectConfig: vi.fn()
}));

vi.mock('../programming/effective-cv-definition-tree', () => ({
	getEffectiveCvDefinitionTreeForDecoder: vi.fn()
}));

vi.mock('../programming/object-merge', () => ({
	deepMerge: vi.fn((base: Record<string, unknown>, patch: Record<string, unknown>) => ({ ...base, ...patch }))
}));

vi.mock('../repo/programming/manufacturers.repo', () => ({
	createManufacturer: vi.fn(),
	getManufacturerById: vi.fn(),
	listManufacturers: vi.fn()
}));

vi.mock('../repo/programming/decoder-families.repo', () => ({
	createDecoderFamily: vi.fn(),
	getDecoderFamilyById: vi.fn(),
	listDecoderFamiliesByManufacturer: vi.fn()
}));

vi.mock('../repo/programming/decoder.repo', () => ({
	createDecoder: vi.fn(),
	getDecoderById: vi.fn(),
	listDecodersByFamily: vi.fn()
}));

vi.mock('../repo/programming/cv-definitions.repo', () => ({
	createCvDefinition: vi.fn(),
	deleteCvDefinitionRow: vi.fn(),
	getCvDefinitionById: vi.fn(),
	getCvDefinitionTreeByOwner: vi.fn(),
	listChildCvDefinitions: vi.fn(),
	listCvDefinitionsByOwner: vi.fn(),
	listSiblingCvDefinitions: vi.fn(),
	moveCvDefinitionRow: vi.fn(),
	updateCvDefinitionRow: vi.fn(),
	updateCvDefinitionSortOrderRow: vi.fn()
}));

vi.mock('../repo/programming/cv-definition-overrides.repo', () => ({
	createCvDefinitionOverride: vi.fn(),
	deleteCvDefinitionOverrideRow: vi.fn(),
	getCvDefinitionOverrideById: vi.fn(),
	listCvDefinitionOverridesByBaseDefinition: vi.fn(),
	updateCvDefinitionOverrideRow: vi.fn()
}));

import { parseCvBooleanConfig, parseCvNumberConfig, parseCvSelectConfig } from '../programming/cv-definition-types';
import { getEffectiveCvDefinitionTreeForDecoder } from '../programming/effective-cv-definition-tree';
import { deepMerge } from '../programming/object-merge';
import {
	createCvDefinitionOverride,
	deleteCvDefinitionOverrideRow,
	getCvDefinitionOverrideById,
	listCvDefinitionOverridesByBaseDefinition,
	updateCvDefinitionOverrideRow
} from '../repos/programming/cv-definition-overrides.repo';
import {
	createCvDefinition,
	deleteCvDefinitionRow,
	getCvDefinitionById,
	getCvDefinitionTreeByOwner,
	listChildCvDefinitions,
	listCvDefinitionsByOwner,
	listSiblingCvDefinitions,
	moveCvDefinitionRow,
	updateCvDefinitionRow,
	updateCvDefinitionSortOrderRow
} from '../repos/programming/cv-definitions.repo';
import { createDecoderFamily, getDecoderFamilyById, listDecoderFamiliesByManufacturer } from '../repos/programming/decoder-families.repo';
import { createDecoder, getDecoderById, listDecodersByFamily } from '../repos/programming/decoder.repo';
import { createManufacturer, getManufacturerById, listManufacturers } from '../repos/programming/manufacturers.repo';

import {
	addCvDefinition,
	addCvDefinitionOverride,
	addCvFolder,
	appendCvDefinition,
	createDecoderFamilyTemplate,
	createDecoderTemplate,
	createManufacturerTemplate,
	deleteCvDefinition,
	deleteCvDefinitionOverride,
	getCvDefinitionTreeForDecoderTemplate,
	getCvDefinitionTreeForFamilyTemplate,
	getDecoderFamiliesForManufacturer,
	getDecodersForFamily,
	getManufacturers,
	insertCvDefinitionAtPosition,
	moveCvDefinitionToPosition,
	updateCvDefinition,
	updateCvDefinitionOverride
} from './decoder-template.service';

const mockedCreateCvDefinition = vi.mocked(createCvDefinition);
const mockedDeleteCvDefinitionRow = vi.mocked(deleteCvDefinitionRow);
const mockedGetCvDefinitionById = vi.mocked(getCvDefinitionById);
const mockedGetCvDefinitionTreeByOwner = vi.mocked(getCvDefinitionTreeByOwner);
const mockedListChildCvDefinitions = vi.mocked(listChildCvDefinitions);
const mockedListCvDefinitionsByOwner = vi.mocked(listCvDefinitionsByOwner);
const mockedListSiblingCvDefinitions = vi.mocked(listSiblingCvDefinitions);
const mockedMoveCvDefinitionRow = vi.mocked(moveCvDefinitionRow);
const mockedUpdateCvDefinitionRow = vi.mocked(updateCvDefinitionRow);
const mockedUpdateCvDefinitionSortOrderRow = vi.mocked(updateCvDefinitionSortOrderRow);

const mockedCreateDecoderFamily = vi.mocked(createDecoderFamily);
const mockedGetDecoderFamilyById = vi.mocked(getDecoderFamilyById);
const mockedListDecoderFamiliesByManufacturer = vi.mocked(listDecoderFamiliesByManufacturer);

const mockedCreateDecoder = vi.mocked(createDecoder);
const mockedGetDecoderById = vi.mocked(getDecoderById);
const mockedListDecodersByFamily = vi.mocked(listDecodersByFamily);

const mockedCreateManufacturer = vi.mocked(createManufacturer);
const mockedGetManufacturerById = vi.mocked(getManufacturerById);
const mockedListManufacturers = vi.mocked(listManufacturers);

const mockedParseCvNumberConfig = vi.mocked(parseCvNumberConfig);
const mockedParseCvBooleanConfig = vi.mocked(parseCvBooleanConfig);
const mockedParseCvSelectConfig = vi.mocked(parseCvSelectConfig);

const mockedGetEffectiveCvDefinitionTreeForDecoder = vi.mocked(getEffectiveCvDefinitionTreeForDecoder);

const mockedCreateCvDefinitionOverride = vi.mocked(createCvDefinitionOverride);
const mockedDeleteCvDefinitionOverrideRow = vi.mocked(deleteCvDefinitionOverrideRow);
const mockedGetCvDefinitionOverrideById = vi.mocked(getCvDefinitionOverrideById);
const mockedListCvDefinitionOverridesByBaseDefinition = vi.mocked(listCvDefinitionOverridesByBaseDefinition);
const mockedUpdateCvDefinitionOverrideRow = vi.mocked(updateCvDefinitionOverrideRow);

const mockedDeepMerge = vi.mocked(deepMerge);

const db = {} as Db;

describe('createManufacturerTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('delegates to createManufacturer with given params', () => {
		createManufacturerTemplate(db, { id: 'm-1', name: 'Acme' });

		expect(mockedCreateManufacturer).toHaveBeenCalledWith(db, { id: 'm-1', name: 'Acme' });
	});
});

describe('getManufacturers', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns the list from listManufacturers', () => {
		const rows = [{ id: 'm-1', name: 'Acme', created_at: '', updated_at: '' }];
		mockedListManufacturers.mockReturnValue(rows as never);

		expect(getManufacturers(db)).toBe(rows);
		expect(mockedListManufacturers).toHaveBeenCalledWith(db);
	});
});

describe('createDecoderFamilyTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates family when manufacturer exists', () => {
		mockedGetManufacturerById.mockReturnValue({ id: 'm-1' } as never);

		createDecoderFamilyTemplate(db, { id: 'f-1', manufacturerId: 'm-1', name: 'Series X' });

		expect(mockedCreateDecoderFamily).toHaveBeenCalledWith(
			db,
			expect.objectContaining({ id: 'f-1', manufacturerId: 'm-1', name: 'Series X' })
		);
	});

	it('rejects creation when manufacturer does not exist', () => {
		mockedGetManufacturerById.mockReturnValue(null as never);

		expect(() => createDecoderFamilyTemplate(db, { id: 'f-1', manufacturerId: 'missing', name: 'Series X' })).toThrow(
			'Hersteller "missing" wurde nicht gefunden.'
		);

		expect(mockedCreateDecoderFamily).not.toHaveBeenCalled();
	});
});

describe('getDecoderFamiliesForManufacturer', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns families when manufacturer exists', () => {
		const families = [{ id: 'f-1' }];
		mockedGetManufacturerById.mockReturnValue({ id: 'm-1' } as never);
		mockedListDecoderFamiliesByManufacturer.mockReturnValue(families as never);

		expect(getDecoderFamiliesForManufacturer(db, 'm-1')).toBe(families);
		expect(mockedListDecoderFamiliesByManufacturer).toHaveBeenCalledWith(db, 'm-1');
	});

	it('rejects lookup when manufacturer does not exist', () => {
		mockedGetManufacturerById.mockReturnValue(null as never);

		expect(() => getDecoderFamiliesForManufacturer(db, 'missing')).toThrow('Hersteller "missing" wurde nicht gefunden.');
	});
});

describe('createDecoderTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates decoder when family exists', () => {
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'f-1' } as never);

		createDecoderTemplate(db, { id: 'd-1', familyId: 'f-1', name: 'Decoder A' });

		expect(mockedCreateDecoder).toHaveBeenCalledWith(db, expect.objectContaining({ id: 'd-1', familyId: 'f-1', name: 'Decoder A' }));
	});

	it('rejects creation when family does not exist', () => {
		mockedGetDecoderFamilyById.mockReturnValue(null as never);

		expect(() => createDecoderTemplate(db, { id: 'd-1', familyId: 'missing', name: 'Decoder A' })).toThrow(
			'Decoder-Familie "missing" wurde nicht gefunden.'
		);

		expect(mockedCreateDecoder).not.toHaveBeenCalled();
	});
});

describe('getDecodersForFamily', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns decoders when family exists', () => {
		const decoders = [{ id: 'd-1' }];
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'f-1' } as never);
		mockedListDecodersByFamily.mockReturnValue(decoders as never);

		expect(getDecodersForFamily(db, 'f-1')).toBe(decoders);
		expect(mockedListDecodersByFamily).toHaveBeenCalledWith(db, 'f-1');
	});

	it('rejects lookup when family does not exist', () => {
		mockedGetDecoderFamilyById.mockReturnValue(null as never);

		expect(() => getDecodersForFamily(db, 'missing')).toThrow('Decoder-Familie "missing" wurde nicht gefunden.');
	});
});

describe('addCvFolder', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates a folder definition at the requested position', () => {
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'family-1' } as never);
		mockedListSiblingCvDefinitions.mockReturnValue([{ id: 'folder-1', sort_order: 999999 }] as never);

		addCvFolder(db, {
			id: 'folder-1',
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: null,
			position: 0,
			key: 'settings',
			name: 'Settings',
			description: 'Config folder'
		});

		expect(mockedCreateCvDefinition).toHaveBeenCalledWith(
			db,
			expect.objectContaining({
				id: 'folder-1',
				ownerType: 'family',
				ownerId: 'family-1',
				type: 'folder',
				key: 'settings',
				name: 'Settings',
				description: 'Config folder',
				sortOrder: 999999
			})
		);
	});

	it('rejects when owner family does not exist', () => {
		mockedGetDecoderFamilyById.mockReturnValue(null as never);

		expect(() =>
			addCvFolder(db, {
				id: 'folder-1',
				ownerType: 'family',
				ownerId: 'missing',
				key: 'settings',
				name: 'Settings'
			})
		).toThrow('Decoder-Familie "missing" wurde nicht gefunden.');

		expect(mockedCreateCvDefinition).not.toHaveBeenCalled();
	});

	it('creates a folder when a valid parent folder is supplied', () => {
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'family-1' } as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'parent-folder',
			type: 'folder',
			owner_type: 'family',
			owner_id: 'family-1'
		} as never);
		mockedListSiblingCvDefinitions.mockReturnValue([{ id: 'child-folder', sort_order: 999999 }] as never);

		addCvFolder(db, {
			id: 'child-folder',
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: 'parent-folder',
			position: 0,
			key: 'sub',
			name: 'Sub'
		});

		expect(mockedCreateCvDefinition).toHaveBeenCalledWith(
			db,
			expect.objectContaining({ id: 'child-folder', parentId: 'parent-folder', type: 'folder' })
		);
	});

	it('rejects when the supplied parent definition is not a folder', () => {
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'family-1' } as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'parent-1',
			type: 'cv_number',
			owner_type: 'family',
			owner_id: 'family-1'
		} as never);

		expect(() =>
			addCvFolder(db, {
				id: 'folder-1',
				ownerType: 'family',
				ownerId: 'family-1',
				parentId: 'parent-1',
				key: 'sub',
				name: 'Sub'
			})
		).toThrow('Parent-Definition "parent-1" ist kein folder.');

		expect(mockedCreateCvDefinition).not.toHaveBeenCalled();
	});

	it('rejects when the supplied parent folder belongs to a different family', () => {
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'family-1' } as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'parent-folder',
			type: 'folder',
			owner_type: 'family',
			owner_id: 'family-2'
		} as never);

		expect(() =>
			addCvFolder(db, {
				id: 'folder-1',
				ownerType: 'family',
				ownerId: 'family-1',
				parentId: 'parent-folder',
				key: 'sub',
				name: 'Sub'
			})
		).toThrow('Parent-Definition "parent-folder" gehört nicht zur Decoder-Familie "family-1".');

		expect(mockedCreateCvDefinition).not.toHaveBeenCalled();
	});
});

describe('addCvDefinitionOverride', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('creates override when decoder and base definition belong to the same family', () => {
		mockedGetDecoderById.mockReturnValue({ id: 'd-1', family_id: 'f-1' } as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'base-1',
			owner_type: 'family',
			owner_id: 'f-1'
		} as never);

		addCvDefinitionOverride(db, {
			id: 'ovr-1',
			decoderId: 'd-1',
			baseDefinitionId: 'base-1',
			patch: { name: 'Override Name' }
		});

		expect(mockedCreateCvDefinitionOverride).toHaveBeenCalledWith(
			db,
			expect.objectContaining({ id: 'ovr-1', decoderId: 'd-1', baseDefinitionId: 'base-1' })
		);
	});

	it('rejects override when base definition is not a family definition', () => {
		mockedGetDecoderById.mockReturnValue({ id: 'd-1', family_id: 'f-1' } as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'base-1',
			owner_type: 'decoder',
			owner_id: 'd-1'
		} as never);

		expect(() =>
			addCvDefinitionOverride(db, {
				id: 'ovr-1',
				decoderId: 'd-1',
				baseDefinitionId: 'base-1',
				patch: {}
			})
		).toThrow('Basisdefinition "base-1" ist keine Familien-Definition.');

		expect(mockedCreateCvDefinitionOverride).not.toHaveBeenCalled();
	});

	it('rejects override when base definition belongs to a different family', () => {
		mockedGetDecoderById.mockReturnValue({ id: 'd-1', family_id: 'f-1' } as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'base-1',
			owner_type: 'family',
			owner_id: 'f-2'
		} as never);

		expect(() =>
			addCvDefinitionOverride(db, {
				id: 'ovr-1',
				decoderId: 'd-1',
				baseDefinitionId: 'base-1',
				patch: {}
			})
		).toThrow('Basisdefinition "base-1" gehört nicht zur Familie des Decoders "d-1".');

		expect(mockedCreateCvDefinitionOverride).not.toHaveBeenCalled();
	});
});

describe('getCvDefinitionTreeForFamilyTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns definition tree when family exists', () => {
		const tree = [{ id: 'node-1', children: [] }];
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'f-1' } as never);
		mockedGetCvDefinitionTreeByOwner.mockReturnValue(tree as never);

		expect(getCvDefinitionTreeForFamilyTemplate(db, 'f-1')).toBe(tree);
		expect(mockedGetCvDefinitionTreeByOwner).toHaveBeenCalledWith(db, 'family', 'f-1');
	});

	it('rejects when family does not exist', () => {
		mockedGetDecoderFamilyById.mockReturnValue(null as never);

		expect(() => getCvDefinitionTreeForFamilyTemplate(db, 'missing')).toThrow('Decoder-Familie "missing" wurde nicht gefunden.');
	});
});

describe('getCvDefinitionTreeForDecoderTemplate', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('returns effective tree when decoder exists', () => {
		const tree = [{ id: 'node-1', children: [] }];
		mockedGetDecoderById.mockReturnValue({ id: 'd-1', family_id: 'f-1' } as never);
		mockedGetEffectiveCvDefinitionTreeForDecoder.mockReturnValue(tree as never);

		expect(getCvDefinitionTreeForDecoderTemplate(db, 'd-1')).toBe(tree);
		expect(mockedGetEffectiveCvDefinitionTreeForDecoder).toHaveBeenCalledWith(db, 'f-1', 'd-1');
	});

	it('rejects when decoder does not exist', () => {
		mockedGetDecoderById.mockReturnValue(null as never);

		expect(() => getCvDefinitionTreeForDecoderTemplate(db, 'missing')).toThrow('Decoder "missing" wurde nicht gefunden.');
	});
});

describe('addCvDefinition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('inserts a new definition at the requested position and reassigns sibling sort order', () => {
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'family-1' } as never);
		mockedListCvDefinitionsByOwner.mockReturnValue([] as never);
		mockedListSiblingCvDefinitions.mockReturnValue([
			{ id: 'a', sort_order: 10 },
			{ id: 'new-def', sort_order: 999999 },
			{ id: 'b', sort_order: 20 }
		] as never);

		addCvDefinition(db, {
			id: 'new-def',
			ownerType: 'family',
			ownerId: 'family-1',
			parentId: null,
			position: 0,
			key: 'speed',
			type: 'cv_number',
			name: 'Speed',
			description: null,
			config: { cv: 1, min: 0, max: 255 }
		});

		expect(mockedCreateCvDefinition).toHaveBeenCalledWith(db, expect.objectContaining({ id: 'new-def', sortOrder: 999999 }));
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(1, db, { id: 'new-def', sortOrder: 10 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(2, db, { id: 'a', sortOrder: 20 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(3, db, { id: 'b', sortOrder: 30 });
	});

	it('rejects duplicate keys within the same owner', () => {
		mockedGetDecoderFamilyById.mockReturnValue({ id: 'family-1' } as never);
		mockedListCvDefinitionsByOwner.mockReturnValue([{ key: 'speed' }] as never);

		expect(() =>
			addCvDefinition(db, {
				id: 'new-def',
				ownerType: 'family',
				ownerId: 'family-1',
				parentId: null,
				key: 'speed',
				type: 'cv_number',
				name: 'Speed',
				description: null,
				config: { cv: 1, min: 0, max: 255 }
			})
		).toThrow('Der Key "speed" existiert bereits für family "family-1".');

		expect(mockedCreateCvDefinition).not.toHaveBeenCalled();
	});
});

describe('moveCvDefinitionToPosition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('moves a definition to a new parent, reorders target siblings, and normalizes old siblings', () => {
		mockedGetCvDefinitionById
			.mockReturnValueOnce({
				id: 'moved',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: 'old-parent'
			} as never)
			.mockReturnValueOnce({
				id: 'new-parent',
				type: 'folder',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null
			} as never)
			.mockReturnValueOnce({
				id: 'new-parent',
				parent_id: null
			} as never);

		mockedListSiblingCvDefinitions
			.mockReturnValueOnce([
				{ id: 'x', sort_order: 10 },
				{ id: 'moved', sort_order: 999999 },
				{ id: 'y', sort_order: 20 }
			] as never)
			.mockReturnValueOnce([
				{ id: 'old-1', sort_order: 10 },
				{ id: 'old-2', sort_order: 30 }
			] as never);

		moveCvDefinitionToPosition(db, {
			id: 'moved',
			parentId: 'new-parent',
			position: 0
		});

		expect(mockedMoveCvDefinitionRow).toHaveBeenCalledWith(db, {
			id: 'moved',
			parentId: 'new-parent',
			sortOrder: 999999
		});
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(1, db, { id: 'moved', sortOrder: 10 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(2, db, { id: 'x', sortOrder: 20 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(3, db, { id: 'y', sortOrder: 30 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(4, db, { id: 'old-2', sortOrder: 20 });
	});

	it('rejects moving a definition below itself', () => {
		mockedGetCvDefinitionById
			.mockReturnValueOnce({
				id: 'node-1',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null
			} as never)
			.mockReturnValueOnce({
				id: 'node-1',
				type: 'folder',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null
			} as never);

		expect(() =>
			moveCvDefinitionToPosition(db, {
				id: 'node-1',
				parentId: 'node-1',
				position: 0
			})
		).toThrow('CV-Definition "node-1" kann nicht ihr eigener Parent sein.');

		expect(mockedMoveCvDefinitionRow).not.toHaveBeenCalled();
	});

	it('rejects moving a definition when new parent chain would create a cycle', () => {
		mockedGetCvDefinitionById
			.mockReturnValueOnce({
				id: 'node-1',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null
			} as never)
			.mockReturnValueOnce({
				id: 'node-2',
				type: 'folder',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: 'node-3'
			} as never)
			.mockReturnValueOnce({
				id: 'node-2',
				parent_id: 'node-3'
			} as never)
			.mockReturnValueOnce({
				id: 'node-3',
				parent_id: 'node-1'
			} as never);

		expect(() =>
			moveCvDefinitionToPosition(db, {
				id: 'node-1',
				parentId: 'node-2',
				position: 0
			})
		).toThrow('Verschieben von "node-1" würde einen Zyklus erzeugen.');

		expect(mockedMoveCvDefinitionRow).not.toHaveBeenCalled();
	});
});

describe('updateCvDefinition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('updates a definition when config is valid for its existing type', () => {
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'cv-1',
			type: 'cv_number',
			owner_type: 'family',
			owner_id: 'family-1'
		} as never);
		mockedParseCvNumberConfig.mockReturnValue({ cv: 1, min: 0, max: 255 } as never);

		updateCvDefinition(db, {
			id: 'cv-1',
			parentId: null,
			sortOrder: 20,
			name: 'Updated speed',
			description: null,
			config: { cv: 1, min: 0, max: 255 }
		});

		expect(mockedUpdateCvDefinitionRow).toHaveBeenCalledWith(db, {
			id: 'cv-1',
			parentId: null,
			sortOrder: 20,
			name: 'Updated speed',
			description: null,
			config: { cv: 1, min: 0, max: 255 }
		});
	});

	it('calls parseCvBooleanConfig when updating a cv_boolean definition', () => {
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'cv-1',
			type: 'cv_boolean',
			owner_type: 'family',
			owner_id: 'family-1'
		} as never);

		updateCvDefinition(db, {
			id: 'cv-1',
			parentId: null,
			sortOrder: 10,
			name: 'Light Function',
			description: null,
			config: { cv: 29, bit: 0 }
		});

		expect(mockedParseCvBooleanConfig).toHaveBeenCalledWith({ cv: 29, bit: 0 });
		expect(mockedUpdateCvDefinitionRow).toHaveBeenCalled();
	});

	it('calls parseCvSelectConfig when updating a cv_select definition', () => {
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'cv-1',
			type: 'cv_select',
			owner_type: 'family',
			owner_id: 'family-1'
		} as never);

		updateCvDefinition(db, {
			id: 'cv-1',
			parentId: null,
			sortOrder: 10,
			name: 'Motor Mode',
			description: null,
			config: { cv: 29, options: [] }
		});

		expect(mockedParseCvSelectConfig).toHaveBeenCalledWith({ cv: 29, options: [] });
		expect(mockedUpdateCvDefinitionRow).toHaveBeenCalled();
	});

	it('throws for an unknown definition type', () => {
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'cv-1',
			type: 'unknown_type' as never,
			owner_type: 'family',
			owner_id: 'family-1'
		} as never);

		expect(() =>
			updateCvDefinition(db, {
				id: 'cv-1',
				parentId: null,
				sortOrder: 10,
				name: 'X',
				description: null,
				config: {}
			})
		).toThrow('Unbekannter CV-Definition-Typ: unknown_type');
	});

	it('validates parent when updating a decoder-owned definition', () => {
		mockedGetCvDefinitionById
			.mockReturnValueOnce({
				id: 'cv-1',
				type: 'cv_number',
				owner_type: 'decoder',
				owner_id: 'd-1'
			} as never)
			.mockReturnValueOnce({
				id: 'parent-folder',
				type: 'folder',
				owner_type: 'decoder',
				owner_id: 'd-1',
				parent_id: null
			} as never)
			.mockReturnValueOnce({
				id: 'parent-folder',
				parent_id: null
			} as never);
		mockedParseCvNumberConfig.mockReturnValue({ cv: 1, min: 0, max: 255 } as never);
		mockedGetDecoderById.mockReturnValue({ id: 'd-1', family_id: 'f-1' } as never);

		updateCvDefinition(db, {
			id: 'cv-1',
			parentId: 'parent-folder',
			sortOrder: 10,
			name: 'Speed',
			description: null,
			config: { cv: 1, min: 0, max: 255 }
		});

		expect(mockedUpdateCvDefinitionRow).toHaveBeenCalledWith(db, expect.objectContaining({ id: 'cv-1', parentId: 'parent-folder' }));
	});
});

describe('deleteCvDefinition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes a definition when no children and no overrides exist', () => {
		mockedGetCvDefinitionById.mockReturnValue({ id: 'base-1', owner_type: 'family' } as never);
		mockedListChildCvDefinitions.mockReturnValue([] as never);
		mockedListCvDefinitionOverridesByBaseDefinition.mockReturnValue([] as never);

		deleteCvDefinition(db, 'base-1');

		expect(mockedDeleteCvDefinitionRow).toHaveBeenCalledWith(db, 'base-1');
	});

	it('blocks deleting a family definition when overrides still reference it', () => {
		mockedGetCvDefinitionById.mockReturnValue({ id: 'base-1', owner_type: 'family' } as never);
		mockedListChildCvDefinitions.mockReturnValue([] as never);
		mockedListCvDefinitionOverridesByBaseDefinition.mockReturnValue([{ id: 'ovr-1' }] as never);

		expect(() => deleteCvDefinition(db, 'base-1')).toThrow(
			'CV-Definition "base-1" kann nicht gelöscht werden, weil noch 1 Override(s) darauf verweisen.'
		);

		expect(mockedDeleteCvDefinitionRow).not.toHaveBeenCalled();
	});

	it('blocks deleting definition when child elements still exist', () => {
		mockedGetCvDefinitionById.mockReturnValue({ id: 'base-1', owner_type: 'decoder' } as never);
		mockedListChildCvDefinitions.mockReturnValue([{ id: 'child-1' }, { id: 'child-2' }] as never);

		expect(() => deleteCvDefinition(db, 'base-1')).toThrow(
			'CV-Definition "base-1" kann nicht gelöscht werden, weil noch 2 Kind-Element(e) existieren.'
		);

		expect(mockedDeleteCvDefinitionRow).not.toHaveBeenCalled();
	});
});

describe('updateCvDefinitionOverride', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('rejects override patches with unsupported fields', () => {
		mockedGetCvDefinitionOverrideById.mockReturnValue({
			id: 'ovr-1',
			base_definition_id: 'base-1'
		} as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'base-1',
			type: 'cv_number',
			config_json: '{"cv":1,"min":0,"max":255}'
		} as never);

		expect(() =>
			updateCvDefinitionOverride(db, {
				id: 'ovr-1',
				isDisabled: false,
				patch: { unsupported: true } as never
			})
		).toThrow('Override-Patch für "base-1" enthält nicht erlaubtes Feld "unsupported".');

		expect(mockedUpdateCvDefinitionOverrideRow).not.toHaveBeenCalled();
	});

	it('validates merged config and updates override when patch contains config changes', () => {
		mockedGetCvDefinitionOverrideById.mockReturnValue({
			id: 'ovr-1',
			base_definition_id: 'base-1'
		} as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'base-1',
			type: 'cv_number',
			config_json: '{"cv":1,"min":0,"max":255}'
		} as never);
		mockedDeepMerge.mockReturnValue({ cv: 1, min: 0, max: 255, default: 42 } as never);

		updateCvDefinitionOverride(db, {
			id: 'ovr-1',
			isDisabled: true,
			patch: { config: { default: 42 } }
		});

		expect(mockedDeepMerge).toHaveBeenCalledWith({ cv: 1, min: 0, max: 255 }, { default: 42 });
		expect(mockedParseCvNumberConfig).toHaveBeenCalledWith({ cv: 1, min: 0, max: 255, default: 42 });
		expect(mockedUpdateCvDefinitionOverrideRow).toHaveBeenCalledWith(db, {
			id: 'ovr-1',
			isDisabled: true,
			patch: { config: { default: 42 } }
		});
	});

	it('rejects override patch config when base definition config_json is invalid', () => {
		mockedGetCvDefinitionOverrideById.mockReturnValue({
			id: 'ovr-1',
			base_definition_id: 'base-1'
		} as never);
		mockedGetCvDefinitionById.mockReturnValue({
			id: 'base-1',
			type: 'cv_number',
			config_json: 'not-json'
		} as never);

		expect(() =>
			updateCvDefinitionOverride(db, {
				id: 'ovr-1',
				isDisabled: false,
				patch: { config: { default: 10 } }
			})
		).toThrow('Basisdefinition "base-1" enthält ungültiges config_json.');

		expect(mockedUpdateCvDefinitionOverrideRow).not.toHaveBeenCalled();
	});
});

describe('deleteCvDefinitionOverride', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('deletes override when it exists', () => {
		mockedGetCvDefinitionOverrideById.mockReturnValue({ id: 'ovr-1' } as never);

		deleteCvDefinitionOverride(db, 'ovr-1');

		expect(mockedDeleteCvDefinitionOverrideRow).toHaveBeenCalledWith(db, 'ovr-1');
	});

	it('rejects deleting override when id does not exist', () => {
		mockedGetCvDefinitionOverrideById.mockReturnValue(null as never);

		expect(() => deleteCvDefinitionOverride(db, 'ovr-404')).toThrow('Override "ovr-404" wurde nicht gefunden.');
		expect(mockedDeleteCvDefinitionOverrideRow).not.toHaveBeenCalled();
	});
});

describe('appendCvDefinition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('moves definition to the end of the current sibling list', () => {
		mockedGetCvDefinitionById
			.mockReturnValueOnce({
				id: 'moved',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null
			} as never)
			.mockReturnValueOnce({
				id: 'moved',
				owner_type: 'family',
				owner_id: 'family-1',
				parent_id: null
			} as never);

		mockedListSiblingCvDefinitions.mockReturnValueOnce([{ id: 'a' }, { id: 'b' }] as never).mockReturnValueOnce([
			{ id: 'a', sort_order: 10 },
			{ id: 'b', sort_order: 20 },
			{ id: 'moved', sort_order: 999999 }
		] as never);

		appendCvDefinition(db, { id: 'moved', parentId: null });

		expect(mockedMoveCvDefinitionRow).toHaveBeenCalledWith(db, {
			id: 'moved',
			parentId: null,
			sortOrder: 999999
		});
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(1, db, { id: 'a', sortOrder: 10 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(2, db, { id: 'b', sortOrder: 20 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(3, db, { id: 'moved', sortOrder: 30 });
	});

	it('rejects when definition does not exist', () => {
		mockedGetCvDefinitionById.mockReturnValue(null as never);

		expect(() => appendCvDefinition(db, { id: 'missing', parentId: null })).toThrow('CV-Definition "missing" wurde nicht gefunden.');
	});
});

describe('insertCvDefinitionAtPosition', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('clamps negative position to the first sibling slot', () => {
		mockedGetCvDefinitionById.mockReturnValueOnce({
			id: 'moved',
			owner_type: 'family',
			owner_id: 'family-1',
			parent_id: null
		} as never);
		mockedListSiblingCvDefinitions.mockReturnValueOnce([
			{ id: 'a', sort_order: 10 },
			{ id: 'moved', sort_order: 999999 },
			{ id: 'b', sort_order: 20 }
		] as never);

		insertCvDefinitionAtPosition(db, { id: 'moved', parentId: null, position: -5 });

		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(1, db, { id: 'moved', sortOrder: 10 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(2, db, { id: 'a', sortOrder: 20 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(3, db, { id: 'b', sortOrder: 30 });
	});

	it('clamps position larger than sibling count to the last slot', () => {
		mockedGetCvDefinitionById.mockReturnValueOnce({
			id: 'moved',
			owner_type: 'family',
			owner_id: 'family-1',
			parent_id: null
		} as never);
		mockedListSiblingCvDefinitions.mockReturnValueOnce([
			{ id: 'a', sort_order: 10 },
			{ id: 'moved', sort_order: 999999 },
			{ id: 'b', sort_order: 20 }
		] as never);

		insertCvDefinitionAtPosition(db, { id: 'moved', parentId: null, position: 99 });

		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(1, db, { id: 'a', sortOrder: 10 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(2, db, { id: 'b', sortOrder: 20 });
		expect(mockedUpdateCvDefinitionSortOrderRow).toHaveBeenNthCalledWith(3, db, { id: 'moved', sortOrder: 30 });
	});
});
