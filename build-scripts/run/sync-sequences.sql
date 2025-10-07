-- Synchronize database sequences after data import
-- This script fixes sequence values to match the maximum ID values in their corresponding tables

DO $$
BEGIN
    -- Fix alert_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'alert_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'systemwidealert') THEN
        PERFORM setval('alert_id_seq', COALESCE((SELECT max(alert_id) FROM systemwidealert), 1));
    END IF;

    -- Fix bitstreamformatregistry_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'bitstreamformatregistry_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bitstreamformatregistry') THEN
        PERFORM setval('bitstreamformatregistry_seq', COALESCE((SELECT max(bitstream_format_id) FROM bitstreamformatregistry), 1));
    END IF;

    -- Fix checksum_history_check_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'checksum_history_check_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checksum_history') THEN
        PERFORM setval('checksum_history_check_id_seq', COALESCE((SELECT max(check_id) FROM checksum_history), 1));
    END IF;

    -- Fix cwf_claimtask_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'cwf_claimtask_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cwf_claimtask') THEN
        PERFORM setval('cwf_claimtask_seq', COALESCE((SELECT max(claimtask_id) FROM cwf_claimtask), 1));
    END IF;

    -- Fix cwf_collectionrole_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'cwf_collectionrole_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cwf_collectionrole') THEN
        PERFORM setval('cwf_collectionrole_seq', COALESCE((SELECT max(collectionrole_id) FROM cwf_collectionrole), 1));
    END IF;

    -- Fix cwf_in_progress_user_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'cwf_in_progress_user_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cwf_in_progress_user') THEN
        PERFORM setval('cwf_in_progress_user_seq', COALESCE((SELECT max(in_progress_user_id) FROM cwf_in_progress_user), 1));
    END IF;

    -- Fix cwf_pooltask_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'cwf_pooltask_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cwf_pooltask') THEN
        PERFORM setval('cwf_pooltask_seq', COALESCE((SELECT max(pooltask_id) FROM cwf_pooltask), 1));
    END IF;

    -- Fix cwf_workflowitem_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'cwf_workflowitem_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cwf_workflowitem') THEN
        PERFORM setval('cwf_workflowitem_seq', COALESCE((SELECT max(workflowitem_id) FROM cwf_workflowitem), 1));
    END IF;

    -- Fix cwf_workflowitemrole_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'cwf_workflowitemrole_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cwf_workflowitemrole') THEN
        PERFORM setval('cwf_workflowitemrole_seq', COALESCE((SELECT max(workflowitemrole_id) FROM cwf_workflowitemrole), 1));
    END IF;

    -- Fix doi_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'doi_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'doi') THEN
        PERFORM setval('doi_seq', COALESCE((SELECT max(doi_id) FROM doi), 1));
    END IF;

    -- Fix entity_type_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'entity_type_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'entity_type') THEN
        PERFORM setval('entity_type_id_seq', COALESCE((SELECT max(id) FROM entity_type), 1));
    END IF;

    -- Fix fileextension_seq if both sequence and table exist (this is the one causing the original error)
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'fileextension_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'fileextension') THEN
        PERFORM setval('fileextension_seq', COALESCE((SELECT max(file_extension_id) FROM fileextension), 1));
    END IF;

    -- Fix handle_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'handle_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'handle') THEN
        PERFORM setval('handle_id_seq', COALESCE((SELECT max(handle_id) FROM handle), 1));
    END IF;

    -- Fix harvested_collection_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'harvested_collection_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'harvested_collection') THEN
        PERFORM setval('harvested_collection_seq', COALESCE((SELECT max(id) FROM harvested_collection), 1));
    END IF;

    -- Fix harvested_item_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'harvested_item_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'harvested_item') THEN
        PERFORM setval('harvested_item_seq', COALESCE((SELECT max(id) FROM harvested_item), 1));
    END IF;

    -- Fix metadatafieldregistry_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'metadatafieldregistry_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metadatafieldregistry') THEN
        PERFORM setval('metadatafieldregistry_seq', COALESCE((SELECT max(metadata_field_id) FROM metadatafieldregistry), 1));
    END IF;

    -- Fix metadataschemaregistry_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'metadataschemaregistry_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metadataschemaregistry') THEN
        PERFORM setval('metadataschemaregistry_seq', COALESCE((SELECT max(metadata_schema_id) FROM metadataschemaregistry), 1));
    END IF;

    -- Fix metadatavalue_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'metadatavalue_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'metadatavalue') THEN
        PERFORM setval('metadatavalue_seq', COALESCE((SELECT max(metadata_value_id) FROM metadatavalue), 1));
    END IF;

    -- Fix openurltracker_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'openurltracker_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'openurltracker') THEN
        PERFORM setval('openurltracker_seq', COALESCE((SELECT max(tracker_id) FROM openurltracker), 1));
    END IF;

    -- Fix orcid_history_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'orcid_history_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orcid_history') THEN
        PERFORM setval('orcid_history_id_seq', COALESCE((SELECT max(id) FROM orcid_history), 1));
    END IF;

    -- Fix orcid_queue_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'orcid_queue_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orcid_queue') THEN
        PERFORM setval('orcid_queue_id_seq', COALESCE((SELECT max(id) FROM orcid_queue), 1));
    END IF;

    -- Fix orcid_token_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'orcid_token_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orcid_token') THEN
        PERFORM setval('orcid_token_id_seq', COALESCE((SELECT max(id) FROM orcid_token), 1));
    END IF;

    -- Fix process_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'process_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'process') THEN
        PERFORM setval('process_id_seq', COALESCE((SELECT max(process_id) FROM process), 1));
    END IF;

    -- Fix registrationdata_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'registrationdata_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'registrationdata') THEN
        PERFORM setval('registrationdata_seq', COALESCE((SELECT max(registrationdata_id) FROM registrationdata), 1));
    END IF;

    -- Fix relationship_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'relationship_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'relationship') THEN
        PERFORM setval('relationship_id_seq', COALESCE((SELECT max(id) FROM relationship), 1));
    END IF;

    -- Fix relationship_type_id_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'relationship_type_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'relationship_type') THEN
        PERFORM setval('relationship_type_id_seq', COALESCE((SELECT max(id) FROM relationship_type), 1));
    END IF;

    -- Fix requestitem_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'requestitem_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'requestitem') THEN
        PERFORM setval('requestitem_seq', COALESCE((SELECT max(requestitem_id) FROM requestitem), 1));
    END IF;

    -- Fix resourcepolicy_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'resourcepolicy_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resourcepolicy') THEN
        PERFORM setval('resourcepolicy_seq', COALESCE((SELECT max(policy_id) FROM resourcepolicy), 1));
    END IF;

    -- Fix subscription_parameter_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'subscription_parameter_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_parameter') THEN
        PERFORM setval('subscription_parameter_seq', COALESCE((SELECT max(subscription_id) FROM subscription_parameter), 1));
    END IF;

    -- Fix subscription_seq if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'subscription_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription') THEN
        PERFORM setval('subscription_seq', COALESCE((SELECT max(subscription_id) FROM subscription), 1));
    END IF;

    -- Fix supervision_orders sequence if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'supervision_orders_id_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'supervision_orders') THEN
        PERFORM setval('supervision_orders_id_seq', COALESCE((SELECT max(id) FROM supervision_orders), 1));
    END IF;

    -- Fix versionhistory sequence if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'versionhistory_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'versionhistory') THEN
        PERFORM setval('versionhistory_seq', COALESCE((SELECT max(versionhistory_id) FROM versionhistory), 1));
    END IF;

    -- Fix versionitem sequence if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'versionitem_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'versionitem') THEN
        PERFORM setval('versionitem_seq', COALESCE((SELECT max(versionitem_id) FROM versionitem), 1));
    END IF;

    -- Fix workspaceitem sequence if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'workspaceitem_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'workspaceitem') THEN
        PERFORM setval('workspaceitem_seq', COALESCE((SELECT max(workspace_item_id) FROM workspaceitem), 1));
    END IF;

    -- Fix most_recent_checksum sequence if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'most_recent_checksum_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'most_recent_checksum') THEN
        PERFORM setval('most_recent_checksum_seq', COALESCE((SELECT max(result_id) FROM most_recent_checksum), 1));
    END IF;

    -- Fix checksum_history sequence if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'checksum_history_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'checksum_history') THEN
        PERFORM setval('checksum_history_seq', COALESCE((SELECT max(result_id) FROM checksum_history), 1));
    END IF;

    -- Fix preview sequences if both sequence and table exist
    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'preview_content_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preview_content') THEN
        PERFORM setval('preview_content_seq', COALESCE((SELECT max(preview_content_id) FROM preview_content), 1));
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.sequences WHERE sequence_name = 'preview_content_bitstream_seq') AND
       EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'preview_content_bitstream') THEN
        PERFORM setval('preview_content_bitstream_seq', COALESCE((SELECT max(preview_content_bitstream_id) FROM preview_content_bitstream), 1));
    END IF;
END $$;