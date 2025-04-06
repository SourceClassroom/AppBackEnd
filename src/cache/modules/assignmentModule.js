import { client } from "../client/redisClient.js";
import getOrSetCache from "../strategies/getOrSet.js";
import { invalidateKey } from "../strategies/invalidate.js";

const WEEK_ASSIGNMENT_KEY = (weekId) => `week:${weekId}:assignments`;
const CLASS_ASSIGNMENT_KEY = (classId) => `class:${classId}:assignments`;

