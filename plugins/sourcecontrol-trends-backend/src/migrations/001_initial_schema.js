exports.up = async function(knex) {
  // Source Control Repositories
  await knex.schema.createTable('sourcecontrol_repositories', table => {
    table.string('id').primary();
    table.string('name').notNullable();
    table.string('full_name').notNullable().unique();
    table.string('owner').notNullable();
    table.string('url').notNullable();
    table.text('description').nullable();
    table.string('language').nullable();
    table.string('default_branch').notNullable().defaultTo('main');
    table.boolean('is_private').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
    table.timestamp('last_pushed_at').notNullable();
    table.integer('stars_count').notNullable().defaultTo(0);
    table.integer('forks_count').notNullable().defaultTo(0);
    table.integer('watchers_count').notNullable().defaultTo(0);
    table.integer('open_issues_count').notNullable().defaultTo(0);
    table.boolean('has_issues').notNullable().defaultTo(true);
    table.boolean('has_projects').notNullable().defaultTo(true);
    table.boolean('has_wiki').notNullable().defaultTo(true);
    table.boolean('archived').notNullable().defaultTo(false);
    table.boolean('disabled').notNullable().defaultTo(false);
    table.enum('visibility', ['public', 'private', 'internal']).notNullable().defaultTo('private');
    table.timestamp('last_scan_at').nullable();

    table.index(['owner']);
    table.index(['archived']);
    table.index(['last_scan_at']);
  });

  // Branch Protection Rules
  await knex.schema.createTable('sourcecontrol_branch_protection', table => {
    table.string('id').primary();
    table.string('repository_id').notNullable();
    table.string('branch_name').notNullable();
    table.boolean('protection_enabled').notNullable().defaultTo(false);
    table.boolean('require_pull_request').notNullable().defaultTo(false);
    table.integer('required_reviewers').notNullable().defaultTo(0);
    table.boolean('dismiss_stale_reviews').notNullable().defaultTo(false);
    table.boolean('require_code_owner_reviews').notNullable().defaultTo(false);
    table.boolean('require_status_checks').notNullable().defaultTo(false);
    table.boolean('require_up_to_date').notNullable().defaultTo(false);
    table.boolean('enforce_admins').notNullable().defaultTo(false);
    table.boolean('allow_force_pushes').notNullable().defaultTo(false);
    table.boolean('allow_deletions').notNullable().defaultTo(false);
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();

    table.foreign('repository_id').references('id').inTable('sourcecontrol_repositories').onDelete('CASCADE');
    table.index(['repository_id']);
    table.unique(['repository_id', 'branch_name']);
  });

  // Pull Requests
  await knex.schema.createTable('sourcecontrol_pull_requests', table => {
    table.string('id').primary();
    table.integer('number').notNullable();
    table.string('repository_id').notNullable();
    table.string('title').notNullable();
    table.enum('state', ['open', 'closed', 'merged']).notNullable();
    table.string('author_login').notNullable();
    table.string('author_id').notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
    table.timestamp('closed_at').nullable();
    table.timestamp('merged_at').nullable();
    table.integer('reviewers_count').notNullable().defaultTo(0);
    table.integer('approvals_count').notNullable().defaultTo(0);
    table.integer('requested_changes_count').notNullable().defaultTo(0);
    table.integer('comments_count').notNullable().defaultTo(0);
    table.integer('additions').notNullable().defaultTo(0);
    table.integer('deletions').notNullable().defaultTo(0);
    table.integer('changed_files').notNullable().defaultTo(0);
    table.float('time_to_merge_hours').nullable();
    table.float('time_to_first_review_hours').nullable();
    table.string('base_branch').notNullable();
    table.string('head_branch').notNullable();
    table.boolean('draft').notNullable().defaultTo(false);
    table.boolean('mergeable').nullable();

    table.foreign('repository_id').references('id').inTable('sourcecontrol_repositories').onDelete('CASCADE');
    table.index(['repository_id']);
    table.index(['state']);
    table.index(['created_at']);
    table.index(['author_login']);
    table.unique(['repository_id', 'number']);
  });

  // Commits
  await knex.schema.createTable('sourcecontrol_commits', table => {
    table.string('id').primary();
    table.string('sha').notNullable();
    table.string('repository_id').notNullable();
    table.string('author_login').notNullable();
    table.string('author_id').notNullable();
    table.text('message').notNullable();
    table.timestamp('timestamp').notNullable();
    table.boolean('direct_to_default').notNullable().defaultTo(false);
    table.string('branch_name').notNullable();
    table.integer('additions').notNullable().defaultTo(0);
    table.integer('deletions').notNullable().defaultTo(0);
    table.integer('changed_files').notNullable().defaultTo(0);

    table.foreign('repository_id').references('id').inTable('sourcecontrol_repositories').onDelete('CASCADE');
    table.index(['repository_id']);
    table.index(['timestamp']);
    table.index(['author_login']);
    table.index(['direct_to_default']);
  });

  // Vulnerabilities
  await knex.schema.createTable('sourcecontrol_vulnerabilities', table => {
    table.string('id').primary();
    table.string('repository_id').notNullable();
    table.string('alert_id').notNullable();
    table.enum('severity', ['low', 'medium', 'high', 'critical']).notNullable();
    table.enum('state', ['open', 'fixed', 'dismissed']).notNullable();
    table.string('package_name').notNullable();
    table.string('vulnerable_version_range').notNullable();
    table.string('first_patched_version').nullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
    table.timestamp('dismissed_at').nullable();
    table.timestamp('fixed_at').nullable();
    table.string('dismiss_reason').nullable();
    table.string('cwe').nullable();
    table.string('ghsa_id').notNullable();
    table.text('description').notNullable();

    table.foreign('repository_id').references('id').inTable('sourcecontrol_repositories').onDelete('CASCADE');
    table.index(['repository_id']);
    table.index(['severity']);
    table.index(['state']);
    table.index(['created_at']);
    table.unique(['repository_id', 'alert_id']);
  });

  // Security Scans
  await knex.schema.createTable('sourcecontrol_security_scans', table => {
    table.string('id').primary();
    table.string('repository_id').notNullable();
    table.enum('scan_type', ['dependabot', 'code_scanning', 'secret_scanning']).notNullable();
    table.enum('status', ['completed', 'failed', 'in_progress']).notNullable();
    table.timestamp('completed_at').nullable();
    table.integer('alerts_count').notNullable().defaultTo(0);
    table.integer('high_severity_count').notNullable().defaultTo(0);
    table.integer('medium_severity_count').notNullable().defaultTo(0);
    table.integer('low_severity_count').notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable();

    table.foreign('repository_id').references('id').inTable('sourcecontrol_repositories').onDelete('CASCADE');
    table.index(['repository_id']);
    table.index(['scan_type']);
    table.index(['completed_at']);
  });

  // Dependencies
  await knex.schema.createTable('sourcecontrol_dependencies', table => {
    table.string('id').primary();
    table.string('repository_id').notNullable();
    table.string('package_name').notNullable();
    table.string('package_version').notNullable();
    table.string('package_manager').notNullable();
    table.string('manifest_path').notNullable();
    table.enum('dependency_type', ['direct', 'indirect']).notNullable();
    table.enum('scope', ['runtime', 'development']).notNullable();
    table.boolean('is_outdated').notNullable().defaultTo(false);
    table.string('latest_version').nullable();
    table.integer('major_versions_behind').notNullable().defaultTo(0);
    table.integer('minor_versions_behind').notNullable().defaultTo(0);
    table.integer('patch_versions_behind').notNullable().defaultTo(0);
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();

    table.foreign('repository_id').references('id').inTable('sourcecontrol_repositories').onDelete('CASCADE');
    table.index(['repository_id']);
    table.index(['package_name']);
    table.index(['is_outdated']);
    table.index(['major_versions_behind']);
  });

  // Benchmarks
  await knex.schema.createTable('sourcecontrol_benchmarks', table => {
    table.string('id').primary();
    table.string('metric').notNullable().unique();
    table.float('pass_threshold').nullable();
    table.float('warn_threshold').nullable();
    table.float('fail_threshold').nullable();
    table.enum('comparison_operator', ['gte', 'lte', 'range', 'eq']).notNullable();
    table.string('unit').notNullable();
    table.text('description').notNullable();
    table.enum('category', ['security', 'quality', 'process', 'performance']).notNullable();
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();
    table.string('created_by').notNullable();

    table.index(['category']);
  });

  // Metrics
  await knex.schema.createTable('sourcecontrol_metrics', table => {
    table.string('id').primary();
    table.string('repository_id').notNullable();
    table.date('metric_date').notNullable();
    
    // PR Metrics
    table.float('avg_time_to_merge_pr_hours').nullable();
    table.float('review_coverage_percent').nullable();
    table.integer('stale_pr_count').notNullable().defaultTo(0);
    table.integer('total_open_pr_count').notNullable().defaultTo(0);
    table.float('stale_pr_ratio').nullable();
    table.float('avg_pr_size_lines').nullable();
    
    // Security Metrics
    table.integer('open_vulnerability_count').notNullable().defaultTo(0);
    table.integer('high_severity_vulnerability_count').notNullable().defaultTo(0);
    table.integer('medium_severity_vulnerability_count').notNullable().defaultTo(0);
    table.integer('low_severity_vulnerability_count').notNullable().defaultTo(0);
    table.integer('days_since_last_security_scan').nullable();
    
    // Repository Health
    table.boolean('branch_protection_enabled').notNullable().defaultTo(false);
    table.integer('direct_commits_to_default_count').notNullable().defaultTo(0);
    table.integer('dependency_drift_count').notNullable().defaultTo(0);
    table.integer('outdated_dependency_count').notNullable().defaultTo(0);
    
    // Collaboration Metrics
    table.integer('active_contributor_count').notNullable().defaultTo(0);
    table.float('avg_commits_per_week').nullable();
    table.boolean('code_owner_file_exists').notNullable().defaultTo(false);
    
    table.timestamp('created_at').notNullable();
    table.timestamp('updated_at').notNullable();

    table.foreign('repository_id').references('id').inTable('sourcecontrol_repositories').onDelete('CASCADE');
    table.index(['repository_id']);
    table.index(['metric_date']);
    table.unique(['repository_id', 'metric_date']);
  });

  // Compliance Reports
  await knex.schema.createTable('sourcecontrol_compliance_reports', table => {
    table.string('id').primary();
    table.string('repository_id').notNullable();
    table.date('report_date').notNullable();
    table.integer('overall_score').notNullable();
    table.enum('overall_status', ['PASS', 'WARN', 'FAIL']).notNullable();
    
    // Individual metric results
    table.enum('time_to_merge_pr_status', ['PASS', 'WARN', 'FAIL']).notNullable();
    table.float('time_to_merge_pr_value').nullable();
    
    table.enum('review_coverage_status', ['PASS', 'WARN', 'FAIL']).notNullable();
    table.float('review_coverage_value').nullable();
    
    table.enum('stale_pr_status', ['PASS', 'WARN', 'FAIL']).notNullable();
    table.float('stale_pr_value').nullable();
    
    table.enum('branch_protection_status', ['PASS', 'WARN', 'FAIL']).notNullable();
    table.boolean('branch_protection_value').notNullable();
    
    table.enum('vulnerability_status', ['PASS', 'WARN', 'FAIL']).notNullable();
    table.integer('vulnerability_value').notNullable();
    
    table.enum('security_scan_status', ['PASS', 'WARN', 'FAIL']).notNullable();
    table.integer('security_scan_value').nullable();
    
    table.enum('dependency_drift_status', ['PASS', 'WARN', 'FAIL']).notNullable();
    table.integer('dependency_drift_value').notNullable();
    
    table.timestamp('created_at').notNullable();

    table.foreign('repository_id').references('id').inTable('sourcecontrol_repositories').onDelete('CASCADE');
    table.index(['repository_id']);
    table.index(['report_date']);
    table.index(['overall_status']);
    table.unique(['repository_id', 'report_date']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('sourcecontrol_compliance_reports');
  await knex.schema.dropTableIfExists('sourcecontrol_metrics');
  await knex.schema.dropTableIfExists('sourcecontrol_benchmarks');
  await knex.schema.dropTableIfExists('sourcecontrol_dependencies');
  await knex.schema.dropTableIfExists('sourcecontrol_security_scans');
  await knex.schema.dropTableIfExists('sourcecontrol_vulnerabilities');
  await knex.schema.dropTableIfExists('sourcecontrol_commits');
  await knex.schema.dropTableIfExists('sourcecontrol_pull_requests');
  await knex.schema.dropTableIfExists('sourcecontrol_branch_protection');
  await knex.schema.dropTableIfExists('sourcecontrol_repositories');
};
