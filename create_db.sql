/* This script creates an empty database.
  If you want to upgrade a database from an older version have a look at create_db_inc.sql
*/ 

CREATE OR REPLACE DATABASE ddmgr
  CHARACTER SET = 'utf8';
USE ddmgr;
CREATE OR REPLACE USER api@localhost IDENTIFIED BY '***YOUR PASSWORD***';

CREATE OR REPLACE TABLE Organisation(
  OrganisationID BIGINT AUTO_INCREMENT PRIMARY KEY,
  OrgName TEXT,
  OrgInfo TEXT
);
GRANT SELECT ON ddmgr.Organisation TO api@localhost;
-- No Insert grant for the moment...

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

CREATE OR REPLACE TABLE Person(
    PersonID BIGINT AUTO_INCREMENT PRIMARY KEY,
    PrimaryOrgID BIGINT, -- Organisation the person is currently acting for
    PersonLogin TEXT NOT NULL UNIQUE,
    PersonName TEXT,
    CreatedTS TIMESTAMP,
    LatestLogin TIMESTAMP,
    Deleted BOOLEAN,
    PasswordHash TEXT,
    CurCampaignID BIGINT,

    CONSTRAINT fk_person_organisation FOREIGN KEY (PrimaryOrgID) REFERENCES Organisation(OrganisationID)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_person_campaign FOREIGN KEY (CurCampaignID) REFERENCES Campaign(CampaignID)
      ON UPDATE CASCADE ON DELETE SET NULL;

);
GRANT SELECT ON ddmgr.Person TO api@localhost;
GRANT INSERT ON ddmgr.Person TO api@localhost;
GRANT UPDATE ON ddmgr.Person TO api@localhost;

CREATE OR REPLACE TABLE Authenticator(
    AuthenticatiorID BIGINT AUTO_INCREMENT PRIMARY KEY,
    PersonID BIGINT NOT NULL,
    CurChallenge TEXT,
    CurChallengeTS TIMESTAMP,
    credentialID TEXT,
    credentialPubKey LONGBLOB,
    counter BIGINT,
    credentialDeviceType TINYTEXT,
    credentialBackedUp BOOLEAN,
    transports TINYTEXT,
    authType TINYTEXT,

    FOREIGN KEY (PersonID) REFERENCES Person(PersonID)
      ON UPDATE CASCADE ON DELETE CASCADE,
    UNIQUE KEY (credentialID)
);
GRANT SELECT ON ddmgr.Authenticator TO api@localhost;
GRANT INSERT ON ddmgr.Authenticator TO api@localhost;
GRANT DELETE ON ddmgr.Authenticator TO api@localhost;

CREATE OR REPLACE TABLE UserSession(
  ID VARCHAR(64) PRIMARY KEY,
  PersonID BIGINT NOT NULL,
  CreateTS TIMESTAMP DEFAULT NULL,
  LastUsedTS TIMESTAMP DEFAULT NULL,
  SessionStatus LONGTEXT,
  CurCampaignID BIGINT,

  CONSTRAINT fk_session_person FOREIGN KEY (PersonID) REFERENCES Person(PersonID)
      ON UPDATE CASCADE ON DELETE CASCADE
  CONSTRAINT fk_session_campaign FOREIGN KEY (CurCampaignID) REFERENCES Campaign(CampaignID) 
      ON UPDATE CASCADE ON DELETE SET NULL;);
 GRANT SELECT, INSERT, UPDATE, DELETE ON ddmgr.UserSession TO api@localhost;

CREATE OR REPLACE TABLE NodeTree(
  NodeTreeID BIGINT AUTO_INCREMENT PRIMARY KEY,
  ParentNodeID BIGINT,
  NodeName TEXT,
  PersonID BIGINT,

  FOREIGN KEY (ParentNodeID) REFERENCES NodeTree(NodeTreeID)
    ON UPDATE CASCADE ON DELETE RESTRICT  
);
CREATE OR REPLACE UNIQUE INDEX UX_NodeTree
  ON NodeTree(ParentNodeID, NodeName);
GRANT SELECT, INSERT, UPDATE, DELETE ON ddmgr.NodeTree TO api@localhost;

CREATE OR REPLACE TABLE DBVersion(
    VersionNum INTEGER PRIMARY KEY,
    VersionTS TIMESTAMP
);
GRANT SELECT ON ddmgr.Authenticator TO api@localhost;
INSERT INTO DBVersion VALUES(0, CURRENT_TIMESTAMP);

DELIMITER $$
CREATE OR REPLACE FUNCTION FCT_CheckPassword(pPersonLogin TEXT, pPassword TEXT)
RETURNS TEXT
BEGIN
  DECLARE v_PWHash, v_Salt TEXT;
  DECLARE v_Delim1, v_Delim2 INT;
  DECLARE v_Ret TEXT;

  SELECT PasswordHash INTO v_PWHash FROM Person WHERE PersonLogin=pPersonLogin;
  SET v_Delim1 = LOCATE(':', v_PWHash);
  SET v_Delim2 = LOCATE(':', v_PWHash, v_Delim1+1);
  SET v_Salt = SUBSTR(v_PWHash, v_Delim1+1, v_Delim2-(v_Delim1+1));

  IF (SUBSTR(v_PWHash, 1, v_Delim1-1) = 'sha256') THEN
    IF (TO_BASE64(SHA2(CONCAT(v_Salt, pPassword), 256))=SUBSTR(v_PWHash, v_Delim2+1)) THEN
      SET v_Ret=1;
    ELSE
      SET v_Ret=0;
    END IF;
  END IF;

  RETURN v_Ret;
END;
$$
DELIMITER ;

GRANT EXECUTE ON FUNCTION FCT_CheckPassword TO api@localhost;

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
    CharUID UUID UNIQUE,
    CharName TEXT,
    DMComment TEXT,

    CurAC INT,
    CurBAB INT,
    CurRefSave INT,
    CurFortSave INT,
    CurWillSave INT,
    CurHP INT,
    CurMaxHP INT,
    CurMove INT,

    XMLData LONGTEXT,

    FOREIGN KEY (OrgID) REFERENCES Organisation(OrganisationID)
      ON UPDATE CASCADE ON DELETE SET NULL,
    FOREIGN KEY (CreatorID) REFERENCES Person(PersonID)
      ON UPDATE CASCADE ON DELETE SET NULL
);
GRANT SELECT ON ddmgr.NPC TO api@localhost;
GRANT INSERT ON ddmgr.NPC TO api@localhost;
GRANT UPDATE ON ddmgr.NPC TO api@localhost;

-- Current Version, should always be the last line of the script
INSERT INTO DBVersion(VersionNum, VersionTS)
  SELECT 2, NOW() WHERE NOT EXISTS(SELECT 1 FROM DBVersion WHERE VersionNum=2);

CREATE OR REPLACE TABLE Enums (
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

CREATE TABLE DataFileUpload (
  FileUploadID INTEGER PRIMARY KEY AUTO_INCREMENT,
  UploadTS TIMESTAMP DEFAULT UTC_TIMESTAMP,
  FileType TEXT,
  Info TEXT,
  XMLData LONGTEXT
);
GRANT SELECT ON ddmgr.DataFileUpload TO api@localhost;
GRANT INSERT ON ddmgr.DataFileUpload TO api@localhost;
GRANT UPDATE ON ddmgr.DataFileUpload TO api@localhost;
