"use strict";

module.exports = function(utils, settings) {

    return {

        update: function(creature, ticks) {

            var scheduledSkill = creature.scheduledSkill, 
                ticksRemaining = ticks;

            if (scheduledSkill) {

                if (scheduledSkill.stage == 'pre') {

                    ticksRemaining = ticks - scheduledSkill.preAnimationMS;

                    scheduledSkill.preAnimationMS = Math.max(0, scheduledSkill.preAnimationMS - ticks);

                    if (scheduledSkill.preAnimationMS == 0) {

                        scheduledSkill.stage = 'active';

                    }

                }

                if (scheduledSkill.stage == 'active') {

                    this.apply(creature, scheduledSkill);

                }

                if (scheduledSkill.stage = 'post' && ticksRemaining) {

                    scheduledSkill.postAnimationMS = Math.max(0, scheduledSkill.postAnimationMS - ticksRemaining);

                    if (scheduledSkill.postAnimationMS == 0) {

                        creature.scheduledSkill = null;

                    }

                }

            }

        },

        apply: function(creature, data) {

            var enemy = data.enemy, 
                result = utils.hitDamage(data.enemy, data.damage.damage, data.damage.flavor, creature.level);

            enemy.hurt(result.damage);

        }, 

        invoke: function(creature, skill, x, y) {

            var weapon, distance, enemies, enemy;

            if (skill.requiresWeapon) {

                weapon = creature.weapon();

                if (!weapon) {

                    return false;

                }

                range = weapon.range;

            }

            if (skill.range !== 'weapon') {

                range = skill.range;

            }

            distance = utils.distance(creature.x, creature.y, x, y);

            if (distance > range) {

                return false;

            }

            enemy = creature.enemy(x, y);

            if (!enemy) {

                return false;

            }

            // schedule the attack
            creature.scheduledSkill = { 
                skill: skill,  
                stage: 'pre', 
                preAnimationMS: skill.preAnimationDurationMS / creature.attackSpeed_current, 
                postAnimationMS: skill.postAnimationDurationMS / creature.attackSpeed_current, 
                x: x, 
                y: y, 
                damage: utils.damage(creature, skill), 
                enemy: enemy
            };

            return true;

        }

    }

};