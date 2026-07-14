CREATE TABLE [dbo].[PrimaryKeyTable] (

	[c1] int NOT NULL, 
	[c2] int NULL
);


GO
ALTER TABLE [dbo].[PrimaryKeyTable] ADD CONSTRAINT PK_PrimaryKeyTable primary key NONCLUSTERED ([c1]);