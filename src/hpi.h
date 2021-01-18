#pragma once
#ifndef __HPI_H__
#define __HPI_H__

#include <memory>
#include <string>
#include <vector>

class TAHPIFile
{

public:
  TAHPIFile();
  ~TAHPIFile();

  void LoadArchive(const std::string& filename);
  auto Files() const -> std::vector<std::string>;
  auto ReadFile(std::string name) -> std::string;

private:
  class impl;
  std::unique_ptr<impl> _pimpl;
};

#endif