-- all_rooms → room_scope (Tasks with no room): true is « Partout », false keeps the default 'some'.
UPDATE "tasks" SET "room_scope" = 'all' WHERE "all_rooms";
