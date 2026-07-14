[StagingDefinition = [Kind = "FastCopy"]]
section Section1;
[DataDestinations = {[Definition = [Kind = "Reference", QueryName = "PO_DataDestination", IsNewTarget = true], Settings = [Kind = "Automatic", TypeSettings = [Kind = "Table"]]]}]
shared PO = let
    Source = Snowflake.Databases("dlhdzca-bab11165.snowflakecomputing.com","READONLY"),
    FABRIKAM_SUPPLIERS_Database = Source{[Name="FABRIKAM_SUPPLIERS",Kind="Database"]}[Data],
    PUBLIC_Schema = FABRIKAM_SUPPLIERS_Database{[Name="PUBLIC",Kind="Schema"]}[Data],
    ORDERS_Table = PUBLIC_Schema{[Name="ORDERS",Kind="Table"]}[Data],
    #"Merged Queries" = Table.NestedJoin(ORDERS_Table, {"PurchaseOrderID"}, POLineItems, {"PurchaseOrderID"}, "PO Line Items", JoinKind.Inner),
    #"Expanded PO Line Items" = Table.ExpandTableColumn(#"Merged Queries", "PO Line Items", {"PurchaseOrderLineID", "StockItemID", "OrderedOuters", "ReceivedOuters", "ExpectedUnitPricePerOuter"}, {"PurchaseOrderLineID", "StockItemID", "OrderedOuters", "ReceivedOuters", "ExpectedUnitPricePerOuter"}),
    #"Changed Type" = Table.TransformColumnTypes(#"Expanded PO Line Items",{{"ContactPersonID", Int64.Type}, {"SupplierID", Int64.Type}, {"PurchaseOrderID", Int64.Type}, {"PurchaseOrderLineID", Int64.Type}, {"StockItemID", Int64.Type}}),
    #"Removed Other Columns" = Table.SelectColumns(#"Changed Type",{"PurchaseOrderID", "OrderDate", "ContactPersonID", "ExpectedDeliveryDate", "PurchaseOrderLineID", "StockItemID", "OrderedOuters", "ExpectedUnitPricePerOuter"})
in
    #"Removed Other Columns";
[DataDestinations = {[Definition = [Kind = "Reference", QueryName = "Supplier_DataDestination", IsNewTarget = true], Settings = [Kind = "Automatic", TypeSettings = [Kind = "Table"]]]}]
shared Supplier = let
  Source = Table.NestedJoin(Suppliers, {"SupplierCategoryID"}, SupplierCategories, {"SupplierCategoryID"}, "STG_SUPPLIER_CATEGORIES", JoinKind.LeftOuter),
  #"Expanded STG_SUPPLIER_CATEGORIES" = Table.ExpandTableColumn(Source, "STG_SUPPLIER_CATEGORIES", {"SupplierCategoryName"}, {"SupplierCategoryName"}),
    #"Removed Other Columns" = Table.SelectColumns(#"Expanded STG_SUPPLIER_CATEGORIES",{"SupplierID", "SupplierName", "SupplierCategoryID", "WebsiteURL", "SupplierCategoryName"}),
    #"Changed Type" = Table.TransformColumnTypes(#"Removed Other Columns",{{"SupplierID", Int64.Type}})
in
    #"Changed Type";
shared SupplierCategories = let
    Source = Snowflake.Databases("dlhdzca-bab11165.snowflakecomputing.com","READONLY"),
    FABRIKAM_SUPPLIERS_Database = Source{[Name="FABRIKAM_SUPPLIERS",Kind="Database"]}[Data],
    PUBLIC_Schema = FABRIKAM_SUPPLIERS_Database{[Name="PUBLIC",Kind="Schema"]}[Data],
    SUPPLIER_CATEGORIES_Table = PUBLIC_Schema{[Name="SUPPLIER_CATEGORIES",Kind="Table"]}[Data],
    #"Removed Duplicates" = Table.Distinct(SUPPLIER_CATEGORIES_Table, {"SupplierCategoryID"})
in
    #"Removed Duplicates";
shared Suppliers = let
    Source = Snowflake.Databases("dlhdzca-bab11165.snowflakecomputing.com","READONLY"),
    FABRIKAM_SUPPLIERS_Database = Source{[Name="FABRIKAM_SUPPLIERS",Kind="Database"]}[Data],
    PUBLIC_Schema = FABRIKAM_SUPPLIERS_Database{[Name="PUBLIC",Kind="Schema"]}[Data],
    SUPPLIERS_Table = PUBLIC_Schema{[Name="SUPPLIERS",Kind="Table"]}[Data],
    #"Changed Type" = Table.TransformColumnTypes(SUPPLIERS_Table,{{"SupplierCategoryID", Int64.Type}})
in
    #"Changed Type";
shared POLineItems = let
    Source = Snowflake.Databases("dlhdzca-bab11165.snowflakecomputing.com","READONLY"),
    FABRIKAM_SUPPLIERS_Database = Source{[Name="FABRIKAM_SUPPLIERS",Kind="Database"]}[Data],
    PUBLIC_Schema = FABRIKAM_SUPPLIERS_Database{[Name="PUBLIC",Kind="Schema"]}[Data],
    ORDERLINES_Table = PUBLIC_Schema{[Name="ORDERLINES",Kind="Table"]}[Data]
in
    ORDERLINES_Table;
shared PO_DataDestination = let
  Pattern = Lakehouse.Contents([CreateNavigationProperties = false, EnableFolding = false, HierarchicalNavigation = true, EnableVorder = true, OutputMetadataRefresh = true]),
  Navigation_1 = Pattern{[workspaceId = "77b56f8d-cd4a-49ba-a22b-e0f91f558ccd"]}[Data],
  Navigation_2 = Navigation_1{[lakehouseId = "0c4052a4-3694-4bf5-989c-839358ac92cb"]}[Data],
  Navigation_3 = Navigation_2{[Id = "dbo", ItemKind = "Schema"]}[Data],
  TableNavigation = Navigation_3{[Id = "PO", ItemKind = "Table"]}?[Data]?
in
  TableNavigation;
shared Supplier_DataDestination = let
  Pattern = Lakehouse.Contents([CreateNavigationProperties = false, EnableFolding = false, HierarchicalNavigation = true, EnableVorder = true, OutputMetadataRefresh = true]),
  Navigation_1 = Pattern{[workspaceId = "77b56f8d-cd4a-49ba-a22b-e0f91f558ccd"]}[Data],
  Navigation_2 = Navigation_1{[lakehouseId = "0c4052a4-3694-4bf5-989c-839358ac92cb"]}[Data],
  Navigation_3 = Navigation_2{[Id = "dbo", ItemKind = "Schema"]}[Data],
  TableNavigation = Navigation_3{[Id = "Supplier", ItemKind = "Table"]}?[Data]?
in
  TableNavigation;
