# createParcels parameter specification


| Parameter          | Required     | Type    | Description |
|--------------------|--------------|---------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| order_id           | required     | string  | A string representing the order id of the parcel, you cannot use duplicated order id in the same request, so this must be unique for each parcel in the same request. When the parcel is created, this order_id let you know which tracking is affected to which order. |
| from_wilaya_name   | required     | string  | A string representing the sender’s wilaya name |
| firstname          | required     | string  | The receiver’s first name.|
| familyname         | required     | string  | The receiver’s family name |
| contact_phone      | required     | string  | The receiver’s phone numbers. Must start with 0 and contain 9 digits for mobile or 8 digits for landline (e.g. 0550123456 for mobile, 023456789 for landline). Multiple numbers can be separated by commas.|
| address            | required     | string  | The receiver’s address |
| to_commune_name    | required     | string  | A string representing the receiver’s commune name.|
| to_wilaya_name     | required     | string  | A string representing the receiver’s wilaya name.|
| product_list       | required     | string  | The description of the shipment’s content.|
| Price              | required     | integer | An integer amount representing the price you want to recover from the receiver. (equal or between 0 and 150000)|
| do_insurance       | Required     | boolean | Whether or not you opt for an insurance (if true : 0% fee of declared_value is applicable, the refund is 100%).|
| declared_value     | Required     | integer | Represents the financial estimation of the items within the parcel. (must be between 0 and 150000) |
| Length             | Required     | integer | An integer amount representing the length of the parcel’s content in centimeters (cm). (greater than or equal to 0) |
| Width              | Required     | integer | An integer amount representing the width of the parcel’s content in centimeters (cm). (greater than or equal to 0) |
| Height             | Required     | integer | An integer amount representing the height of the parcel’s content in centimeters (cm). (greater than or equal to 0) |
| Weight             | Required     | integer | An integer amount representing the weight of the parcel’s content. (greater than or equal to 0)  |
| freeshipping       | required     | boolean | A Boolean representing whether the delivery fee is free (paid by the sender) or not. True = paid by the sender. false = paid by the receiver. |
| is_stopdesk        | required     | boolean | Whether the delivery will be done in a stop-desk or home delivery. True = delivery in stop desk, you must include the param stopdesk_id, see below. False = home delivery|
| stopdesk_id        | conditional  | string  | This parameter is required if is_stopdesk is true, optional if not. This value is the center's id of the stop-desk where you want to send the parcel to. |
| has_exchange       | required     | boolean | A Boolean representing Whether or not you want to make an exchange request for this parcel.|
| economic           | Not required | boolean | Whether or not the parcel is in economic delivery type.|
| product_to_collect | conditional  | string  | This parameter is required if has_exchange is true, optional if not. When has_exchange is true, this value is the designation of what to return in the annexed exchange parcel.   