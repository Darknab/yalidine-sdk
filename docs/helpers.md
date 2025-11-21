# Helpers Documentation

This document describes the utility helpers provided by the module.
Most helpers interact with the server API and optionaly use caching. Some helpers depend on configuration values.

---

## Table Of Contents
1. [getWilayas](#getwilayas)
2. [getCommunesByWilaya](#getcommunesbywilaya)
3. [getCentersByWilaya](#getcentersbywilaya)
4. [getCentersByCommune](#getcentersbycommune)
5. [getFees](#getfees)
6. [calculateBillableWeight](#calculatebillableweight)
7. [Patterns Summary](#patterns-summary)

---

# getWilayas

Fetches a list of wilayas, optionaly filtered by deliverability or specific IDs. Results are cached.

**Signature:**

```js
async function getWilayas({
  deliverableOnly = true,
  params = {}
})

```

**Parameters:**

- `deliverableOnly` (boolean, default: true): Only return wilayas marked as deliverable.

- `params` (object, optional): Additional parameters, including `id` for fetching specific wilayas.

**Returns:**

`Promise<Array>` — Array of wilaya objects:

```js
{
  id: number,
  name: string,
  zone: string,
  is_deliverable?: number  // 1 for deliverable, 0 otherwise. Only included if deliverableOnly is false
}
```
**Notes:**

- Uses caching automatically. Cache key is "wilayas".

- Partial fetching (`params.id`) will filter cached data if available.

- If cache is missing, fetches from the server and updates the cache.

- Wrap calls in try/catch to handle potential API errors.

**Example:**

```js
const wilayas = await getWilayas({ deliverableOnly: false, params: { id: [1,2] } });
```

## getCommunesByWilaya

Fetches communes within a given wilaya. Supports filtering by deliverability and stop desk availability. Uses caching.

**Signature:**

```js
async function getCommunesByWilaya({
  wilayaId,
  deliverableOnly = true,
  hasStopDesk = false,
  params = {}
})
```


**Parameters:**

- `wilayaId` (number): Required. ID of the wilaya.

- `deliverableOnly` (boolean, default: true): Only returns communes marked as deliverable

- `hasStopDesk` (boolean, default: false): Filter communes that have a stop desk.

- `params` (object, optional): Additional parameters, including `id` for partial fetching.

**Returns:**

`Promise<Array>` — Array of commune objects:

```js
{
  id: number,
  name: string,
  delivery_time_parcel: number,
  is_deliverable?: number,  // 1 for deliverable, 0 otherwise. Only if deliverableOnly is false
  has_stop_desk?: number    // 1 if a stop desk exists, 0 otherwise. Only if hasStopDesk is false
}
```

**Notes:**

- Caching key is communes-{wilayaId}.

- Partial fetching (`params.id`) will filter cached data if available.

- If cache is missing, fetches from the server and updates the cache.

- Filters (`deliverableOnly`, `hasStopDesk`) are applied after fetching.

- Wrap calls in try/catch to handle API errors.

**Example:**

```js
const communes = await getCommunesByWilaya({ wilayaId: 16, hasStopDesk: true });
```

## getCentersByWilaya

Fetches delivery centers in a given wilaya. Cached for performance.

**Signature:**

```js
async function getCentersByWilaya({ wilayaId, params = {} })
```

**Parameters:**

- `wilayaId` (number): Required. ID of the wilaya.

- `params` (object, optional): Additional API parameters.

**Returns:**

`Promise<Array>` — Array of center objects:

```js
{
  id: number,
  name: string,
  address: string,
  gps: string,
  commune_id: number,
  commune_name: string,
  wilaya_id: number
}
```

**Notes:**

- Cache key is centers-{wilayaId}.

- If cache is missing, fetches from the server and updates the cache.

- Throws an error if `wilayaId` is missing.

- Wrap calls in try/catch to handle API errors.

**Example:**

```js
const centers = await getCentersByWilaya({ wilayaId: 16 });
```

## getCentersByCommune

Fetches delivery centers in a specific commune.

**Signature:**

```js
async function getCentersByCommune({ communeId, params = {} })
```

**Parameters:**

- `communeId` (number): Required. ID of the commune.

- `params` (object, optional): Additional API parameters.

**Returns:**

`Promise<Array>` — Array of center objects:

```js
{
  id: number,
  name: string,
  address: string,
  gps: string,
  commune_id: number,
  commune_name: string,
  wilaya_id: number
}
```

**Notes:**

- No caching is applied.

- Throws an error if `communeId` is missing.

- Wrap calls in try/catch to handle API errors.

**Example:**

```js
const centers = await getCentersByCommune({ communeId: 1601 });
```

## getFees

Calculates shipping fees between two locations. Accounts for billable weight, oversize fees, and optional starting wilaya from configuration.

**Signature:**

```js
async function getFees({
  fromWilayaId,
  toWilayaId,
  toCommuneId,
  billableWeight = 5
})
```

**Parameters:**

- `fromWilayaId` (number, optional): Origin wilaya. Defaults to getConfig().startingWilaya.

- `toWilayaId` (number): Required. Destination wilaya.

- `toCommuneId` (number): Required. Destination commune.

- `billableWeight` (number, default: 5): Weight used for fee calculation.

**Returns:**

`Promise<Object>` — Object containing fees and metadata:

```js
{
  fees: {
    expressHome: number,
    expressDesk: number,
    economicHome: number | null,
    economicDesk: number | null
  },
  meta: {
    retourFee: number,
    codPercentage: number,
    insurancePercentage: number,
    oversizeApplied: boolean
  }
}
```

**Notes:**

- Oversize fees are calculated based on the billableWeight value you pass in.

- Billable weight accounts for volumetric weight; oversize fees are applied automatically if weight > 5kg.

- Calculates the overweight internally.

- Throws an error if destination wilaya or commune is missing, or if the commune is not found in the API response.

- Wrap calls in try/catch for safe production use.

**Example:**

```js
const fees = await getFees({ toWilayaId: 16, toCommuneId: 1601, billableWeight: 7 });
```

## calculateBillableWeight

Computes the billable weight for a package, considering volumetric weight.

**Signature:**

```js
function calculateBillableWeight(height, width, length, weight)
```

**Parameters:**

- `height` (number): Package height in cm.

- `width` (number): Package width in cm.

- `length` (number): Package length in cm.

- `weight` (number): Actual weight in kg.

**Returns:**

`number` — The higher of actual weight and volumetric weight.

**Notes:**

- Volumetric weight is calculated as: (height * width * length) * 0.0002.

- Use this function to determine billable weight before calling getFees.

**Example:**

```js
const billable = calculateBillableWeight(50, 40, 30, 4); // Returns 4.8 if volumetric > actual
```

## Patterns Summary

- Caching: Most helpers use cache to improve performance. Partial fetches (`params.id`) are supported.

- `getCentersByCommune` does not use caching.

- Deliverability / Stop Desk Filters: Flags control filtering and are applied after fetching.

- Error Handling: Missing required IDs or invalid API responses throw errors. Always wrap calls in try/catch.

- Weight Handling: `calculateBillableWeight` and `getFees` handle volumetric and oversize weight correctly.

- Configuration: Some helpers rely on configuration (e.g., `getFees`). Ensure configuration is initialized.

- Framework Agnostic Considerations: Currently, these helpers assume a Node.js server environment. Future cross-framework support may require adjustments to caching and requests.