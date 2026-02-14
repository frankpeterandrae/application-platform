/*
 * Copyright (c) 2026. Frank-Peter Andrä
 * All rights reserved.
 */

import { getCvDefinitionTreeByOwner, openDb } from '../libs/data-db/src';

const db = openDb();

try {
	/**
	createManufacturer(db, {
		id: 'm-zimo',
		name: 'Zimo'
	});

	createDecoderFamily(db, {
		id: 'f-mx6x',
		manufacturerId: 'm-zimo',
		name: 'MX62n/MX63n/MX64n Decoder Vorlage',
		description: 'Zimo Funktionsdecoder-Familie'
	});

	createDecoder(db, {
		id: 'd-mx63n',
		familyId: 'f-mx6x',
		name: 'MX63n',
		description: 'Konkreter Decoder'
	});

	createCvDefinition(db, {
		id: 'cvd-basic',
		ownerType: 'family',
		ownerId: 'f-mx6x',
		key: 'basic_config',
		type: 'folder',
		name: 'Grundkonfiguration',
		config: {}
	});

	createCvDefinition(db, {
		id: 'cvd-address',
		ownerType: 'family',
		ownerId: 'f-mx6x',
		parentId: 'cvd-basic',
		sortOrder: 10,
		key: 'address',
		type: 'folder',
		name: 'Adresse',
		config: {}
	});

	createCvDefinition(db, {
		id: 'cvd-address-short',
		ownerType: 'family',
		ownerId: 'f-mx6x',
		parentId: 'cvd-address',
		sortOrder: 10,
		key: 'address.short',
		type: 'cv_number',
		name: 'Zweistellige Werte',
		description: 'Geben Sie hier die zweistellige Adresse ein',
		config: {
			cv: 1,
			min: 1,
			max: 127,
			default: 3
		}
	});

	createCvDefinition(db, {
		id: 'cvd-address-long-enabled',
		ownerType: 'family',
		ownerId: 'f-mx6x',
		parentId: 'cvd-address',
		sortOrder: 20,
		key: 'address.long.enabled',
		type: 'cv_boolean',
		name: 'Vierstellige Adressierung',
		config: {
			cv: 29,
			bit: 5,
			default: false
		}
	});

	createCvDefinition(db, {
		id: 'cvd-vendor',
		ownerType: 'family',
		ownerId: 'f-mx6x',
		parentId: 'cvd-basic',
		sortOrder: 30,
		key: 'manufacturer',
		type: 'cv_select',
		name: 'Hersteller',
		config: {
			cv: 8,
			options: [
				{ value: 0, label: 'CML Systems' },
				{ value: 1, label: 'Train Technology' },
				{ value: 11, label: 'NCE' },
				{ value: 14, label: 'PSI-Dynatrol' }
			]
		}
	});

	console.log('Hersteller:', listManufacturers(db));
	console.log('Familien:', listDecoderFamiliesByManufacturer(db, 'm-zimo'));
	console.log('Decoder:', listDecodersByFamily(db, 'f-mx6x'));
**/
	const tree = getCvDefinitionTreeByOwner(db, 'family', 'f-mx6x');
	console.dir(tree, { depth: null });
} finally {
	db.close();
}
