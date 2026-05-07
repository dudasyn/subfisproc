<?php

namespace App\Models;

use App\Config\Database;

class Sector {
    private $db;

    public function __construct() {
        $this->db = Database::getConnection();
    }

    public function getAll($includeInactive = false) {
        $whereClause = "WHERE s.active = 1";
        if ($includeInactive) {
            $whereClause = "WHERE s.active = 1 OR EXISTS (SELECT 1 FROM movements m WHERE m.destination_sector_id = s.id)";
        }

        $stmt = $this->db->query("
            SELECT s.*, 
            (SELECT COUNT(*) FROM sectors s2 WHERE s2.parent_id = s.id AND s2.active = 1) as children_count,
            (SELECT COUNT(*) FROM movements m WHERE m.destination_sector_id = s.id) as movement_count,
            (SELECT COUNT(*) 
             FROM movements m2 
             INNER JOIN (
                 SELECT process_id, MAX(id) as max_id 
                 FROM movements 
                 GROUP BY process_id
             ) latest ON m2.id = latest.max_id 
             WHERE m2.destination_sector_id = s.id) as stationed_processes_count
            FROM sectors s 
            $whereClause 
            ORDER BY 
                s.active DESC,
                (s.parent_id IS NOT NULL) ASC, 
                (CASE WHEN (SELECT COUNT(*) FROM sectors s2 WHERE s2.parent_id = s.id AND s2.active = 1) > 0 THEN 0 ELSE 1 END) ASC,
                s.name ASC
        ");
        
        $sectors = $stmt->fetchAll();

        $central_org_ids = [];
        foreach ($sectors as $s) {
            if ($s['is_internal']) {
                $central_org_ids[] = $s['id'];
            }
        }

        $internal_descendants = $central_org_ids;
        $added = true;
        while ($added) {
            $added = false;
            foreach ($sectors as $s) {
                if ($s['parent_id'] !== null && in_array($s['parent_id'], $internal_descendants) && !in_array($s['id'], $internal_descendants)) {
                    $internal_descendants[] = $s['id'];
                    $added = true;
                }
            }
        }

        foreach ($sectors as &$s) {
            $s['is_internal_hierarchy'] = in_array($s['id'], $internal_descendants);
        }

        return $sectors;
    }

    public function create($data) {
        $stmt = $this->db->prepare('INSERT INTO sectors (name, alias, parent_id, is_internal) VALUES (?, ?, ?, ?)');
        $stmt->execute([
            $data['name'], 
            $data['alias'] ?? '', 
            $data['parent_id'] ?? null, 
            $data['is_internal'] ?? 1
        ]);
        return $this->db->lastInsertId();
    }

    public function update($id, $data) {
        $stmt = $this->db->prepare('UPDATE sectors SET name = ?, alias = ?, parent_id = ?, is_internal = ? WHERE id = ?');
        return $stmt->execute([
            $data['name'], 
            $data['alias'] ?? '', 
            $data['parent_id'] ?? null, 
            $data['is_internal'] ?? 1, 
            $id
        ]);
    }

    public function softDelete($id) {
        $stmt = $this->db->prepare('UPDATE sectors SET active = 0 WHERE id = ?');
        return $stmt->execute([$id]);
    }

    public function merge($source_id, $target_id) {
        try {
            $this->db->beginTransaction();
            
            $stmt = $this->db->prepare('UPDATE movements SET destination_sector_id = ? WHERE destination_sector_id = ?');
            $stmt->execute([$target_id, $source_id]);
            
            $stmt = $this->db->prepare('UPDATE users SET sector_id = ? WHERE sector_id = ?');
            $stmt->execute([$target_id, $source_id]);
            
            $stmt = $this->db->prepare('UPDATE responsibles SET sector_id = ? WHERE sector_id = ?');
            $stmt->execute([$target_id, $source_id]);

            $stmt = $this->db->prepare('UPDATE IGNORE responsible_sectors SET sector_id = ? WHERE sector_id = ?');
            $stmt->execute([$target_id, $source_id]);
            
            $stmt = $this->db->prepare('DELETE FROM responsible_sectors WHERE sector_id = ?');
            $stmt->execute([$source_id]);
            
            $stmt = $this->db->prepare('UPDATE sectors SET active = 0 WHERE id = ?');
            $stmt->execute([$source_id]);
            
            $this->db->commit();
            return true;
        } catch (\Exception $e) {
            $this->db->rollBack();
            throw $e;
        }
    }
}
