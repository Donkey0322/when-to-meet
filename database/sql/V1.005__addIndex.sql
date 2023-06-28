CREATE INDEX ON meet(is_deleted);
CREATE INDEX ON meet(invite_code);
CREATE INDEX ON meet(finalized_end_time_slot_id, finalized_end_time_slot_id);


CREATE INDEX ON meet_member(meet_id);