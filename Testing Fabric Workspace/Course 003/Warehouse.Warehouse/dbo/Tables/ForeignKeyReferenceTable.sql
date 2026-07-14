CREATE TABLE [dbo].[ForeignKeyReferenceTable] (

	[c1] int NOT NULL
);


GO
ALTER TABLE [dbo].[ForeignKeyReferenceTable] ADD CONSTRAINT PK_ForeignKeyReferenceTable primary key NONCLUSTERED ([c1]);