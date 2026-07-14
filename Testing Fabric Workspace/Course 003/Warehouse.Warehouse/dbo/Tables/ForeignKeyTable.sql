CREATE TABLE [dbo].[ForeignKeyTable] (

	[c1] int NOT NULL, 
	[c2] int NULL
);


GO
ALTER TABLE [dbo].[ForeignKeyTable] ADD CONSTRAINT FK_ForeignKeyTablec1 FOREIGN KEY ([c1]) REFERENCES [dbo].[ForeignKeyReferenceTable]([c1]);