/* Incremental scripts to update existing databases to newer versions */

CREATE OR REPLACE TABLE Campaign(
    CampaignID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CreatorID BIGINT,
    OrgID BIGINT,
    CampaignName TEXT NOT NULL,
    ParentCampaignID BIGINT,
    CalendarID BIGINT,
    EpochYear INT,
    EpochDOY INT,
    RoundOffset BIGINT,

    FOREIGN KEY (OrgID) REFERENCES Organisation(OrganisationID)
      ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (CreatorID) REFERENCES Person(PersonID)
      ON UPDATE CASCADE ON DELETE SET NULL
);
GRANT SELECT ON ddmgr.Campaign TO api@localhost;
GRANT INSERT ON ddmgr.Campaign TO api@localhost;
GRANT UPDATE ON ddmgr.Campaign TO api@localhost;

CREATE OR REPLACE TABLE Calendar(
    CalendarID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CreatorID BIGINT,
    CalendarName TEXT NOT NULL,
    -- more to come...

    FOREIGN KEY (CreatorID) REFERENCES Person(PersonID)
      ON UPDATE CASCADE ON DELETE SET NULL
);
GRANT SELECT ON ddmgr.Calendar TO api@localhost;
GRANT INSERT ON ddmgr.Calendar TO api@localhost;
GRANT UPDATE ON ddmgr.Calendar TO api@localhost;

CREATE OR REPLACE TABLE NPC(
    NPCID BIGINT AUTO_INCREMENT PRIMARY KEY,
    CreatorID BIGINT,
    OrgID BIGINT,
    CharName TEXT,
    DMComment TEXT,

    CurAC INT,
    CurBAB INT,
    CurRefSave INT,
    CurFortSave INT,
    CurWillSave INT,
    CurHP INT,
    CurMaxHP INT,
    CorMove INT,

    XMLData LONGTEXT,

    FOREIGN KEY (OrgID) REFERENCES Organisation(OrganisationID)
      ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (CreatorID) REFERENCES Person(PersonID)
      ON UPDATE CASCADE ON DELETE SET NULL
);
GRANT SELECT ON ddmgr.NPC TO api@localhost;
GRANT INSERT ON ddmgr.NPC TO api@localhost;
GRANT UPDATE ON ddmgr.NPC TO api@localhost;

INSERT INTO DBVersion(VersionNum, VersionTS)
  SELECT 1, NOW() WHERE NOT EXISTS(SELECT 1 FROM DBVersion WHERE VersionNum=1);

/* The current campaign is stored in Person, but only transferred to a session when it is initialized. */
ALTER TABLE UserSession ADD CurCampaignID BIGINT;
ALTER TABLE UserSession ADD CONSTRAINT fk_session_campaign 
  FOREIGN KEY (CurCampaignID) REFERENCES Campaign(CampaignID) ON UPDATE CASCADE ON DELETE SET NULL;

ALTER TABLE Person ADD CurCampaignID BIGINT;
ALTER TABLE Person ADD CONSTRAINT fk_person_campaign 
  FOREIGN KEY (CurCampaignID) REFERENCES Campaign(CampaignID) ON UPDATE CASCADE ON DELETE SET NULL;

GRANT UPDATE ON ddmgr.Person TO api@localhost;

ALTER TABLE NPC RENAME COLUMN CorMove TO CurMove;
ALTER TABLE NPC ADD CharUID UUID UNIQUE;

INSERT INTO DBVersion(VersionNum, VersionTS)
  SELECT 2, NOW() WHERE NOT EXISTS(SELECT 1 FROM DBVersion WHERE VersionNum=2);

CREATE TABLE Enums (
  EnumID INTEGER PRIMARY KEY AUTO_INCREMENT,
  EnumType TEXT NOT NULL,
  EnumName TEXT NOT NULL,
  EnumValue TEXT NOT NULL
);
CREATE UNIQUE INDEX UX_Enums ON Enums(EnumType, EnumName);
GRANT SELECT ON ddmgr.Enums TO api@localhost;
GRANT INSERT ON ddmgr.Enums TO api@localhost;
GRANT UPDATE ON ddmgr.Enums TO api@localhost;

CREATE TABLE Classes (
  ClassID INTEGER PRIMARY KEY AUTO_INCREMENT,
  ClassName TEXT NOT NULL,
  Book TINYTEXT NOT NULL,
  ClassDesc LONGTEXT,
  Page TINYTEXT,
  v TINYTEXT, -- Function unclear
  BaseAttackBonus TINYTEXT,
  HitDie INTEGER,
  LevelCount INTEGER,
  SpellCaster TEXT,
  FortSave TINYTEXT,
  RefSave TINYTEXT,
  WillSave TINYTEXT,
  XMLData LONGTEXT
);
CREATE UNIQUE INDEX UX_Classes ON Classes(ClassName, Book);
GRANT SELECT ON ddmgr.Classes TO api@localhost;
GRANT INSERT ON ddmgr.Classes TO api@localhost;
GRANT UPDATE ON ddmgr.Classes TO api@localhost;
