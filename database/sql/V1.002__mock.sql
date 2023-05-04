INSERT INTO time_slot VALUES (1, '00:00:00', '00:30:00');
INSERT INTO time_slot VALUES (2, '00:30:00', '01:00:00');
INSERT INTO time_slot VALUES (3, '01:00:00', '01:30:00');
INSERT INTO time_slot VALUES (4, '01:30:00', '02:00:00');
INSERT INTO time_slot VALUES (5, '02:00:00', '02:30:00');
INSERT INTO time_slot VALUES (6, '02:30:00', '03:00:00');
INSERT INTO time_slot VALUES (7, '03:00:00', '03:30:00');
INSERT INTO time_slot VALUES (8, '03:30:00', '04:00:00');
INSERT INTO time_slot VALUES (9, '04:00:00', '04:30:00');
INSERT INTO time_slot VALUES (10, '04:30:00', '05:00:00');
INSERT INTO time_slot VALUES (11, '05:00:00', '05:30:00');
INSERT INTO time_slot VALUES (12, '05:30:00', '06:00:00');
INSERT INTO time_slot VALUES (13, '06:00:00', '06:30:00');
INSERT INTO time_slot VALUES (14, '06:30:00', '07:00:00');
INSERT INTO time_slot VALUES (15, '07:00:00', '07:30:00');
INSERT INTO time_slot VALUES (16, '07:30:00', '08:00:00');
INSERT INTO time_slot VALUES (17, '08:00:00', '08:30:00');
INSERT INTO time_slot VALUES (18, '08:30:00', '09:00:00');
INSERT INTO time_slot VALUES (19, '09:00:00', '09:30:00');
INSERT INTO time_slot VALUES (20, '09:30:00', '10:00:00');
INSERT INTO time_slot VALUES (21, '10:00:00', '10:30:00');
INSERT INTO time_slot VALUES (22, '10:30:00', '11:00:00');
INSERT INTO time_slot VALUES (23, '11:00:00', '11:30:00');
INSERT INTO time_slot VALUES (24, '11:30:00', '12:00:00');
INSERT INTO time_slot VALUES (25, '12:00:00', '12:30:00');
INSERT INTO time_slot VALUES (26, '12:30:00', '13:00:00');
INSERT INTO time_slot VALUES (27, '13:00:00', '13:30:00');
INSERT INTO time_slot VALUES (28, '13:30:00', '14:00:00');
INSERT INTO time_slot VALUES (29, '14:00:00', '14:30:00');
INSERT INTO time_slot VALUES (30, '14:30:00', '15:00:00');
INSERT INTO time_slot VALUES (31, '15:00:00', '15:30:00');
INSERT INTO time_slot VALUES (32, '15:30:00', '16:00:00');
INSERT INTO time_slot VALUES (33, '16:00:00', '16:30:00');
INSERT INTO time_slot VALUES (34, '16:30:00', '17:00:00');
INSERT INTO time_slot VALUES (35, '17:00:00', '17:30:00');
INSERT INTO time_slot VALUES (36, '17:30:00', '18:00:00');
INSERT INTO time_slot VALUES (37, '18:00:00', '18:30:00');
INSERT INTO time_slot VALUES (38, '18:30:00', '19:00:00');
INSERT INTO time_slot VALUES (39, '19:00:00', '19:30:00');
INSERT INTO time_slot VALUES (40, '19:30:00', '20:00:00');
INSERT INTO time_slot VALUES (41, '20:00:00', '20:30:00');
INSERT INTO time_slot VALUES (42, '20:30:00', '21:00:00');
INSERT INTO time_slot VALUES (43, '21:00:00', '21:30:00');
INSERT INTO time_slot VALUES (44, '21:30:00', '22:00:00');
INSERT INTO time_slot VALUES (45, '22:00:00', '22:30:00');
INSERT INTO time_slot VALUES (46, '22:30:00', '23:00:00');
INSERT INTO time_slot VALUES (47, '23:00:00', '23:30:00');
INSERT INTO time_slot VALUES (48, '23:30:00', '00:00:00');


INSERT INTO account (email, username, pass_hash, notification_preference) VALUES ('a@gmail.com', 'Amber', '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug', 'EMAIL');
INSERT INTO account (email, username, pass_hash, notification_preference) VALUES ('b@gmail.com', 'Donkey', '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug', 'EMAIL');
INSERT INTO account (email, username, pass_hash, notification_preference) VALUES ('c@gmail.com', 'Benson', '$argon2id$v=19$m=65536,t=3,p=4$9n5vrRUCgHAOofQeY6y1Ng$Lu4uhE4EQaGifUNMThhLUQs1JfUq2iSw99DtWx5lSug', 'EMAIL');

INSERT INTO meet (start_date, end_date, start_time_slot_id, end_time_slot_id, title, invite_code, status, finalized_start_date, finalized_end_date) VALUES ('2023-01-01', '2023-01-07', 1, 24, 'SDM meeting', 'qweras', 'CONFIRMED', '2023-01-01', '2023-01-01');
INSERT INTO meet (start_date, end_date, start_time_slot_id, end_time_slot_id, title, invite_code, status, voting_end_time) VALUES ('2023-04-08', '2023-04-15', 1, 24, 'Comebuy Meeting', 'dfzxcv', 'WAITING_FOR_CONFIRM', '2023-04-11 06:06:06');
INSERT INTO meet (start_date, end_date, start_time_slot_id, end_time_slot_id, title, invite_code, status, voting_end_time) VALUES ('2023-04-01', '2023-04-07', 1, 24, 'Final Project first discussion', 'tyuiop', 'VOTING', '2023-04-15 05:05:05');
INSERT INTO meet (start_date, end_date, start_time_slot_id, end_time_slot_id, title, invite_code, status, voting_end_time) VALUES ('2023-04-01', '2023-04-13', 1, 24, 'Final Project second discussion', 'jifhjr', 'VOTING', '2023-04-15 05:05:05');

INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (1, 1, true);
INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (1, 2, false);
INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (1, 3, false);
INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (2, 1, true);
INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (2, 2, false);
INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (3, 1, true);
INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (3, 3, false);
INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (4, 1, true);
INSERT INTO meet_member (meet_id, member_id, is_host) VALUES (4, 2, false);

INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (6, '2023-04-06', 3);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (6, '2023-04-06', 4);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (6, '2023-04-06', 5);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (6, '2023-04-06', 6);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (6, '2023-04-06', 7);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (6, '2023-04-06', 11);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (7, '2023-04-05', 4);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (7, '2023-04-05', 8);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (7, '2023-04-05', 12);
-- INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (8, '2023-04-09', 5);
-- INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (8, '2023-04-09', 9);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (9, '2023-04-09', 6);
INSERT INTO meet_member_available_time(meet_member_id, date, time_slot_id) VALUES (9, '2023-04-09', 10);

INSERT INTO event(meet_id, account_id) VALUES (1, 1);



