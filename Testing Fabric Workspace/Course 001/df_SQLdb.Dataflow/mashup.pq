[StagingDefinition = [Kind = "FastCopy"]]
section Section1;
[DataDestinations = {[Definition = [Kind = "Reference", QueryName = "Customer_DataDestination", IsNewTarget = true], Settings = [Kind = "Automatic", TypeSettings = [Kind = "Table"]]]}]
shared Customer = let
  Source = Sql.Database("faiad-pw.database.windows.net", "FAIAD-ODL"),
  #"Navigation 1" = Source{[Schema = "dbo", Item = "Customer"]}[Data]
in
  #"Navigation 1";
[DataDestinations = {[Definition = [Kind = "Reference", QueryName = "People_DataDestination", IsNewTarget = true], Settings = [Kind = "Automatic", TypeSettings = [Kind = "Table"]]]}]
shared People = let
  Source = Sql.Database("faiad-pw.database.windows.net", "FAIAD-ODL"),
  #"Navigation 1" = Source{[Schema = "dbo", Item = "People"]}[Data]
in
  #"Navigation 1";
shared Customer_DataDestination = let
  Pattern = Lakehouse.Contents([CreateNavigationProperties = false, EnableFolding = false, HierarchicalNavigation = true, EnableVorder = true, OutputMetadataRefresh = true]),
  Navigation_1 = Pattern{[workspaceId = "77b56f8d-cd4a-49ba-a22b-e0f91f558ccd"]}[Data],
  Navigation_2 = Navigation_1{[lakehouseId = "0c4052a4-3694-4bf5-989c-839358ac92cb"]}[Data],
  Navigation_3 = Navigation_2{[Id = "dbo", ItemKind = "Schema"]}[Data],
  TableNavigation = Navigation_3{[Id = "Customer", ItemKind = "Table"]}?[Data]?
in
  TableNavigation;
shared People_DataDestination = let
  Pattern = Lakehouse.Contents([CreateNavigationProperties = false, EnableFolding = false, HierarchicalNavigation = true, EnableVorder = true, OutputMetadataRefresh = true]),
  Navigation_1 = Pattern{[workspaceId = "77b56f8d-cd4a-49ba-a22b-e0f91f558ccd"]}[Data],
  Navigation_2 = Navigation_1{[lakehouseId = "0c4052a4-3694-4bf5-989c-839358ac92cb"]}[Data],
  Navigation_3 = Navigation_2{[Id = "dbo", ItemKind = "Schema"]}[Data],
  TableNavigation = Navigation_3{[Id = "People", ItemKind = "Table"]}?[Data]?
in
  TableNavigation;
