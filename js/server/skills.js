"use strict";

module.exports = function(utils, settings, blueprints, components) {

    return {

        blueprints: blueprints, 

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

                    scheduledSkill.stage = 'post';

                }

                if (scheduledSkill.stage == 'post' && ticksRemaining) {
                    
                    scheduledSkill.postAnimationMS = Math.max(0, scheduledSkill.postAnimationMS - ticksRemaining);

                    if (scheduledSkill.postAnimationMS == 0) {

                        creature.scheduledSkill = null;

                    }

                }

            }

        },

        createProjectile: function(source, data) {

            data.type = data.skill.deferredType;

            return {
                x: source.x, 
                y: source.y, 
                source: source, 
                data: data, 
                speed: data.skill.projectileSpeed,
                asset: 'projectile',  
                width: 5, 
                height: 5, 
                map: source.map, 
                moveTo: function(x, y, range) {
                    components.Movement.moveTo(this, x, y, range);
                }, 
                packFields: ['x', 'y', 'width', 'height', 'asset'], 
                pack: function() {
                    return utils.pack(this);
                }
            };

        }, 

        applyDamageToSingleTarget: function(target, damage, flavor, source, skill) {
         
            var result = utils.hitDamage(target, damage, flavor, source.level);
            
            target.hurt(result.damage);

            if (result.reflectedDamage) {

                result = utils.hitDamage(source, result.reflectedDamage, 'physical', target.level);
                source.hurt(result.damage);

            }

        }, 

        // perform a hit against a target
        apply_meleeSingleTarget: function(creature, data) {
            
            this.applyDamageToSingleTarget(data.enemy, data.damage.damage, data.damage.flavor, creature, data.skill);
 
            if (data.skill.dotDamageMultiplier) {

                data.enemy.applyDot(data.damage.damage * data.skill.dotDamageMultiplier, data.skill.dotDamageDurationMS, data.damage.flavor, creature);

            }
            
        }, 

        // send a single projectile towards the target
        apply_singleProjectile: function(creature, data) {

            var projectile = this.createProjectile(creature, data);

            projectile.moveTo(data.x, data.y, data.skill.range);

            creature.launchProjectile(projectile);

        }, 

        // re-position the creature to the target position
        apply_teleport: function(creature, data) {
            console.log('teleport');
            creature.setPosition(data.x, data.y);

        }, 

        apply: function(creature, data) {
            
            this['apply_' + data.type](creature, data);

        }, 

        invoke: function(creature, skill, x, y) {
            
            var weapon, distance, enemies, enemy, range, speed;
     
            if (skill.requiresWeapon) {

                weapon = creature.weapon();

                if (!weapon) {
                    console.log('err no weapon');
                    return false;

                }

                speed = creature.attackSpeed_current;
                range = weapon.range;

            } else {

                speed = 1;

            }

            if (skill.range !== 'weapon') {

                range = skill.range;

            }

            distance = utils.distance(creature.x, creature.y, x, y);
            
            if (distance > range) {
                console.log('err out of range: ', creature.x, creature.y, x, y, distance, range);
                return false;

            }

            if (skill.requiresWeapon) {

                enemy = creature.enemy(x, y);

                if (!enemy) {
                    console.log('err no enemy');
                    return false;

                }
            
            }

            // schedule the attack
            creature.scheduledSkill = { 
                skill: skill, 
                type: skill.type,  
                stage: 'pre', 
                preAnimationMS: skill.preAnimationDurationMS / speed, 
                postAnimationMS: skill.postAnimationDurationMS / speed, 
                x: x, 
                y: y, 
                damage: utils.damage(creature, skill), 
                enemy: enemy
            };
            
            if (skill.cooldown) {

                skill.cooldown_current = skill.cooldown;

            }

            return true;

        }

    }

};