-- Down Migration
ALTER TABLE motorcycles
ADD CONSTRAINT motorcycles_license_plate_key UNIQUE (license_plate);