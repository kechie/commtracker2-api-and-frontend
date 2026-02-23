
DECLARE
    new_id_number INTEGER;
    approval_year INTEGER;
    member_type_char CHAR(1);
    last_id TEXT;
    id_parts TEXT[];
   current_year_part INTEGER;
    current_type_part CHAR(1);
BEGIN
IF NEW.date_of_approval_or_disapproval IS NULL THEN
   NEW.membership_id := NULL;
     RETURN NEW;
 END IF;

approval_year := EXTRACT(YEAR FROM NEW.date_of_approval_or_disapproval);
 member_type_char := UPPER(LEFT(NEW.member_type::text, 1));

 IF (TG_OP = 'INSERT') OR
    (TG_OP = 'UPDATE' AND (
       NEW.member_type IS DISTINCT FROM OLD.member_type OR
       NEW.date_of_approval_or_disapproval IS DISTINCT FROM OLD.date_of_approval_or_disapproval OR
       NEW.membership_id IS NULL OR
       NEW.membership_id IS DISTINCT FROM OLD.membership_id
    )) THEN

      IF NEW.membership_id IS NOT NULL THEN
         id_parts := string_to_array(NEW.membership_id, '-');
         IF array_length(id_parts, 1) = 3 THEN
             current_year_part := id_parts[1]::INTEGER;
             current_type_part := UPPER(LEFT(id_parts[2], 1));

             IF current_year_part = approval_year AND current_type_part = member_type_char THEN
                 RETURN NEW;
             END IF;
         END IF;
     END IF;

     SELECT membership_id INTO last_id
     FROM "members"
     WHERE membership_id LIKE approval_year || '-%'
     ORDER BY membership_id DESC
     LIMIT 1;

     IF last_id IS NOT NULL AND array_length(string_to_array(last_id, '-'), 1) = 3 THEN
         new_id_number := (split_part(last_id, '-', 3))::INTEGER + 1;
     ELSE
         new_id_number := 1;
     END IF;

     NEW.membership_id := approval_year || '-' || member_type_char || '-' || LPAD(new_id_number::TEXT, 4, '0');
 END IF;

 RETURN NEW;
END;

CREATE OR REPLACE FUNCTION generate_membership_id()
RETURNS TRIGGER AS $$
DECLARE
    new_id_number INTEGER;
    approval_year INTEGER;
    member_type_char CHAR(1);
    last_id TEXT;
    id_parts TEXT[];
    current_year_part INTEGER;
     current_type_part CHAR(1);
 BEGIN
     -- 1. Handle cases where there's no approval date
     IF NEW.date_of_approval_or_disapproval IS NULL THEN
         NEW.membership_id := NULL;
         RETURN NEW;
     END IF;

     approval_year := EXTRACT(YEAR FROM NEW.date_of_approval_or_disapproval);
     member_type_char := UPPER(LEFT(NEW.member_type::text, 1));

     -- 2. Check if we need to (re)generate the ID
     IF (TG_OP = 'INSERT') OR
        (TG_OP = 'UPDATE' AND (
           NEW.member_type IS DISTINCT FROM OLD.member_type OR
           NEW.date_of_approval_or_disapproval IS DISTINCT FROM OLD.date_of_approval_or_disapproval OR
           NEW.membership_id IS NULL OR
           NEW.membership_id IS DISTINCT FROM OLD.membership_id
        )) THEN

         -- 3. If an ID already exists, check if it already matches the correct Year and Type
         IF NEW.membership_id IS NOT NULL THEN
             id_parts := string_to_array(NEW.membership_id, '-');
             IF array_length(id_parts, 1) = 3 THEN
                 current_year_part := id_parts[1]::INTEGER;
                 current_type_part := UPPER(LEFT(id_parts[2], 1));

                 -- If Year and Type are already correct, keep the ID as is
                 IF current_year_part = approval_year AND current_type_part = member_type_char THEN
                     RETURN NEW;
                 END IF;
             END IF;
         END IF;

         -- 4. Find the highest number for this YEAR and TYPE
         -- We filter by BOTH Year and Type, and use NUMERIC sorting to find the real maximum
         SELECT membership_id INTO last_id
         FROM "members"
         WHERE membership_id LIKE approval_year || '-' || member_type_char || '-%'
         ORDER BY NULLIF(split_part(membership_id, '-', 3), '')::INTEGER DESC
         LIMIT 1;

         IF last_id IS NOT NULL AND array_length(string_to_array(last_id, '-'), 1) = 3 THEN
             new_id_number := (split_part(last_id, '-', 3))::INTEGER + 1;
         ELSE
             new_id_number := 1;
         END IF;

         -- 5. Format the new ID (e.g., 2010-R-0005)
         NEW.membership_id := approval_year || '-' || member_type_char || '-' || LPAD(new_id_number::TEXT, 4, '0');
     END IF;

     RETURN NEW;
 END;
 $$ LANGUAGE plpgsql;
